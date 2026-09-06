import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../supabase';
import { SurveyRequest } from '../types';
import { FORMAT_CURRENCY, INDONESIAN_BANKS } from '../constants';
import { 
    updateSurveyRequest, 
    uploadSurveyPhoto, 
    deleteSurveyPhoto,
    generateDeterministicUuid,
    getSurveyCatalogSettings,
    getSurveyCatalogLogs,
    SurveyCatalogLogEntry,
    uploadFileAndGetURL
} from '../adminService';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    BarChart, Bar, Legend
} from 'recharts';
import { 
    Zap, Home, ClipboardList, Wallet, User, ShieldCheck, 
    Menu, X, LogOut, Bell, MessageSquare, Search,
    Calendar, Clock, Phone, MapPin, Navigation, Share2,
    CheckCircle2, AlertTriangle, AlertCircle, Trash2, Plus, Edit3,
    Camera, Eye, Lock, Maximize2, LocateFixed, Pin, Link as LinkIcon,
    RefreshCw, Bed, Bath, Fan, Sparkles, ImagePlus, ChevronDown, ChevronRight, Check,
    Smartphone, MessageCircle, ExternalLink, ArrowLeft, UploadCloud, Edit, Mail, Heart,
    Signal, Wifi, BatteryCharging, CheckSquare, Layers, Building2,
    Loader2, GraduationCap, Store, ShoppingBag, Building, Fuel, Church,
    ShieldAlert, CookingPot, ParkingCircle, Droplets, Armchair
} from 'lucide-react';
import {
    isBannerProneCategory,
    processPhotoWithAutoSensor,
    processImageUrlWithAutoSensor
} from '../autoSensorService';
import { PhotoSensorModal } from '../components/common/PhotoSensorModal';
import { 
    findNearbyCuratedLandmarks, 
    calculateHaversineDistance,
    CuratedLandmarkResult 
} from '../constants/curatedLandmarks';
import { notifySurveyStatusUpdate } from '../notificationService';
import { notifyAdminWithdrawalRequest } from '../emailService';
import AgentProfile from './AgentProfile';
import { Page } from '../types';

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

const formatThousand = (val: any) => {
    if (val === undefined || val === null || val === '') return '';
    // Strip everything except digits
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

const DUMMY_WITHDRAWAL_DATA = [
    {
        id: 'WD-DUMMY-101',
        amount: 210000,
        date: new Date(Date.now() - 432000000).toISOString(),
        status: 'Selesai',
        bank_name: 'BCA',
        bank_account: '1234567890',
        bank_account_name: 'Agen Survey Dummy'
    },
    {
        id: 'WD-DUMMY-102',
        amount: 140000,
        date: new Date(Date.now() - 864000000).toISOString(),
        status: 'Selesai',
        bank_name: 'BCA',
        bank_account: '1234567890',
        bank_account_name: 'Agen Survey Dummy'
    }
];

interface AgentDashboardProps {
    uid: string;
    surveyRequests: SurveyRequest[];
    loadSurveyRequests: (silent?: boolean) => Promise<void>;
    activeMenu: 'overview' | 'tasks' | 'wallet' | 'profile';
    onMenuChange: (menu: 'overview' | 'tasks' | 'wallet' | 'profile') => void;
    verificationStatus?: string;
    user?: any;
    onLogout?: () => void;
    onPageChange?: (p: Page) => void;
    isLoading?: boolean;
}

const extractCoordinates = (mapsUrl: string | null | undefined) => {
    if (!mapsUrl || typeof mapsUrl !== 'string') return null;
    
    // 1. Try parsing coordinates directly in query string: ?q=lat,lng or ?query=lat,lng
    let match = mapsUrl.match(/[?&](?:q|query|daddr)=([-\d.]+),([-\d.]+)/);
    if (match) {
        return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
    }
    
    // 2. Try parsing coordinates in URL path: /@lat,lng or /place/lat,lng
    match = mapsUrl.match(/@([-\d.]+),([-\d.]+)/);
    if (match) {
        return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
    }

    // 3. Try parsing plain coordinates from the text e.g. "-5.1234, 119.5678"
    match = mapsUrl.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
    if (match) {
        return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
    }

    return null;
};

export interface EvaluationData {
    hasRevision: boolean;
    date: string;
    items: string[];
    adminNote: string;
    rawNotes: string;
    facade: boolean;
    gps: boolean;
    publicFacilities: boolean;
    rules: boolean;
    landmark: boolean;
    roomSize: boolean;
    roomFacilities: boolean;
    roomPhotos: boolean;
    occupants: boolean;
    pricing: boolean;
    partner: boolean;
    hasProperty: boolean;
    hasRoom: boolean;
    hasPartner: boolean;
}

export const getFormattedRevisionDateTime = (req: any, evalData?: any): string => {
    const rawDate = req.updated_at || req.created_at;
    if (rawDate) {
        try {
            const d = new Date(rawDate);
            if (!isNaN(d.getTime())) {
                const datePart = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
                const timePart = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':');
                return `${datePart}, ${timePart} WITA`;
            }
        } catch (e) {}
    }
    return evalData?.date ? `${evalData.date}` : 'Terbaru';
};

export const detectProvinceFromAddress = (addr?: string | null): string => {
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
    if (lower.includes('banten') || lower.includes('tangerang') || lower.includes('serang') || lower.includes('cilegon')) return 'Banten';
    if (lower.includes('sumatera utara') || lower.includes('medan')) return 'Sumatera Utara';
    if (lower.includes('sumatera barat') || lower.includes('padang')) return 'Sumatera Barat';
    if (lower.includes('sumatera selatan') || lower.includes('palembang')) return 'Sumatera Selatan';
    if (lower.includes('riau') || lower.includes('pekanbaru')) return 'Riau';
    if (lower.includes('kepulauan riau') || lower.includes('batam')) return 'Kepulauan Riau';
    if (lower.includes('lampung') || lower.includes('bandar lampung')) return 'Lampung';
    if (lower.includes('kalimantan timur') || lower.includes('samarinda') || lower.includes('balikpapan')) return 'Kalimantan Timur';
    return 'Sulawesi Selatan';
};

export const parseEvaluationData = (notesText?: string | null, status?: string | null): EvaluationData => {
    const rawNotes = (notesText || '').trim();
    const lower = rawNotes.toLowerCase();
    
    const containsRevisionTag = lower.includes('[revisi') || lower.includes('evaluasi admin') || lower.includes('perlu diperbaiki') || lower.includes('revisi');
    const isSubmittedOrApproved = status === 'SUBMITTED' || status === 'APPROVED' || status === 'COMPLETED' || status === 'PENDING_ONBOARDING';
    const hasRevision = Boolean(containsRevisionTag && !isSubmittedOrApproved);
    
    // Find all [REVISI ...] blocks
    const revisionBlocks = rawNotes.split(/\[REVISI\s*([^\]]*)\]/i);
    let latestDate = '';
    let latestContent = rawNotes;

    if (revisionBlocks.length > 1) {
        latestDate = revisionBlocks[revisionBlocks.length - 2]?.trim() || '';
        latestContent = revisionBlocks[revisionBlocks.length - 1]?.trim() || '';
    }

    const items: string[] = [];
    const lines = latestContent.split('\n');
    let isExtractingItems = false;
    const adminNoteLines: string[] = [];
    let isExtractingAdminNote = false;

    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (line.includes('Catatan Evaluasi Admin:') || line.includes('Catatan:') || line.startsWith('📝')) {
            isExtractingItems = false;
            isExtractingAdminNote = true;
            const rest = line.replace(/.*(?:Catatan Evaluasi Admin:|Catatan:|📝)\s*/i, '').trim();
            if (rest) adminNoteLines.push(rest);
            continue;
        }

        if (line.includes('Bagian yang Perlu Diperbaiki:') || line.startsWith('📌')) {
            isExtractingItems = true;
            isExtractingAdminNote = false;
            continue;
        }

        if (isExtractingAdminNote) {
            if (line && !line.startsWith('[REVISI') && !line.startsWith('KostManager Onboarding') && !line.startsWith('📍 Link GPS:')) {
                adminNoteLines.push(line);
            }
        } else if (isExtractingItems || line.startsWith('-') || line.startsWith('•')) {
            const cleaned = line.replace(/^[-•*]\s*/, '').replace(/^[🏢🛏️👥📋]\s*/, '').trim();
            if (cleaned && !cleaned.includes('Data Properti Umum:') && !cleaned.includes('Kamar & Fasilitas Unit:') && !cleaned.includes('Data Penghuni & Status Sewa:') && !cleaned.includes('Mitra & Kerjasama:')) {
                if (!items.includes(cleaned)) {
                    items.push(cleaned);
                }
            }
        }
    }

    const adminNote = adminNoteLines.join('\n').trim();
    const n = latestContent.toLowerCase() || lower;

    const facade = n.includes('foto utama') || n.includes('fasad') || n.includes('foto depan');
    const gps = n.includes('titik koordinat') || n.includes('gps') || n.includes('maps');
    const publicFacilities = n.includes('fasilitas umum');
    const rules = n.includes('deskripsi & peraturan') || n.includes('peraturan kost') || n.includes('deskripsi') || n.includes('peraturan');
    const landmark = n.includes('landmark') || n.includes('kampus') || n.includes('estimasi jarak');
    const hasProperty = facade || gps || publicFacilities || rules || landmark || n.includes('properti umum');

    const roomSize = n.includes('ukuran & dimensi') || n.includes('ukuran') || n.includes('dimensi');
    const roomFacilities = n.includes('fasilitas utama kamar') || n.includes('fasilitas kamar mandi') || n.includes('fasilitas dapur') || n.includes('kelengkapan perabot') || n.includes('fasilitas kamar');
    const roomPhotos = n.includes('foto dokumentasi unit') || n.includes('foto unit') || n.includes('foto kamar');
    const occupants = n.includes('status kamar (terisi') || n.includes('identitas penghuni') || n.includes('penghuni') || n.includes('data penyewa');
    const pricing = n.includes('tarif sewa') || n.includes('periode sewa') || n.includes('harga sewa');
    const hasRoom = roomSize || roomFacilities || roomPhotos || occupants || pricing || n.includes('kamar & fasilitas') || n.includes('data penghuni');

    const bank = n.includes('rekening bank') || n.includes('nomor rekening');
    const partner = n.includes('kontak pemilik') || n.includes('syarat & ketentuan') || n.includes('mitra & kerjasama');
    const signature = n.includes('tanda tangan digital') || n.includes('tanda tangan');
    const hasPartner = bank || partner || signature || n.includes('mitra & kerjasama');

    return {
        hasRevision,
        date: latestDate || 'Terbaru',
        items,
        adminNote,
        rawNotes,
        facade,
        gps,
        publicFacilities,
        rules,
        landmark,
        roomSize,
        roomFacilities,
        roomPhotos,
        occupants,
        pricing,
        partner: hasPartner,
        hasProperty,
        hasRoom,
        hasPartner
    };
};

const AgentDashboard: React.FC<AgentDashboardProps> = ({ 
    uid, 
    user,
    surveyRequests, 
    loadSurveyRequests,
    activeMenu,
    onMenuChange,
    verificationStatus,
    onLogout,
    onPageChange,
    isLoading = false
}) => {
    const parseDimensionParts = (sizeStr?: string) => {
        if (!sizeStr) return { length: '', width: '' };
        const str = String(sizeStr).replace(/meter/gi, '').trim();
        const parts = str.split(/[\times xX×]/);
        return {
            length: parts[0] ? parts[0].trim() : '',
            width: parts[1] ? parts[1].trim() : ''
        };
    };

    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [uploadSourceFieldId, setUploadSourceFieldId] = useState<string | null>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);
    const [searchParams, setSearchParams] = useSearchParams();
    const agentTab = (searchParams.get('status') as 'pending' | 'active' | 'history') || 'pending';
    const setAgentTab = (newTab: 'pending' | 'active' | 'history') => {
        setSearchParams({ status: newTab });
    };
    const [profileImgError, setProfileImgError] = useState(false);
    const [agentReferralCode, setAgentReferralCode] = useState('');
    // State untuk riwayat referral — nama pemilik kost yang bergabung via kode referral agen
    const [referralHistory, setReferralHistory] = useState<{ name: string; created_at: string }[]>([]);
    const [referralTickerIndex, setReferralTickerIndex] = useState(0);

    const generateReferralCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = 'AG';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    };

    useEffect(() => {
        const checkAndFetchReferral = async () => {
            if (user && user.role === 'survey_agent' && uid) {
                try {
                    const { data, error } = await supabase
                        .from('agents')
                        .select('referral_code')
                        .eq('user_id', uid)
                        .maybeSingle();
                    
                    if (data?.referral_code) {
                        setAgentReferralCode(data.referral_code);
                    } else {
                        const code = generateReferralCode();
                        console.log("Generating referral code for agent:", code);
                        const { error: upsertError } = await supabase
                            .from('agents')
                            .upsert({ user_id: uid, referral_code: code }, { onConflict: 'user_id' });
                        if (upsertError) {
                            console.warn("Failed to save generated referral code:", upsertError.message);
                        } else {
                            setAgentReferralCode(code);
                        }
                    }

                    // Fetch riwayat pemilik kost yang bergabung via referral kode ini
                    const codeToCheck = data?.referral_code || agentReferralCode;
                    if (codeToCheck) {
                        const { data: referredMitra } = await supabase
                            .from('users')
                            .select('name, created_at')
                            .eq('referred_by', codeToCheck)
                            .eq('role', 'mitra')
                            .order('created_at', { ascending: false });
                        if (referredMitra) setReferralHistory(referredMitra);
                    }
                } catch (err) {
                    console.error("Error fetching/generating referral code:", err);
                }
            }
        };
        checkAndFetchReferral();
    }, [user, uid]);

    // Auto-scroll ticker referral setiap 3 detik
    useEffect(() => {
        if (referralHistory.length === 0) return;
        const timer = setInterval(() => {
            setReferralTickerIndex(prev => (prev + 1) % referralHistory.length);
        }, 3000);
        return () => clearInterval(timer);
    }, [referralHistory]);

    // Wallet State
    const [walletView, setWalletView] = useState<'balance' | 'history' | 'bank'>('balance');
    const [isWithdrawing, setIsWithdrawing] = useState(false);
    const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);
    const [agentBankName, setAgentBankName] = useState('BCA');
    const [agentBankAccount, setAgentBankAccount] = useState('');
    const [agentAccountName, setAgentAccountName] = useState('');
    const [withdrawalHistory, setWithdrawalHistory] = useState<any[]>([]);
    const [isLoadingWallet, setIsLoadingWallet] = useState(false);
    const [agentCommissionFlat, setAgentCommissionFlat] = useState(35000);
    const [changeLogs, setChangeLogs] = useState<SurveyCatalogLogEntry[]>([]);
    
    // Load survey catalog settings (for agent commission flat amount) & logs
    useEffect(() => {
        getSurveyCatalogSettings().then((settings) => {
            if (settings.agent_commission_flat !== undefined) {
                setAgentCommissionFlat(settings.agent_commission_flat);
            }
        }).catch((err) => {
            console.error('Gagal load survey catalog settings:', err);
        });

        getSurveyCatalogLogs().then((logs) => {
            setChangeLogs(logs);
        }).catch((err) => {
            console.error('Gagal load riwayat log katalog survey:', err);
        });
    }, []);
    
    // Modal State
    const [isEditingSurvey, setIsEditingSurvey] = useState<SurveyRequest | null>(null);
    const [surveyForm, setSurveyForm] = useState<any>({});
    const [isUploadingSurveyPhoto, setIsUploadingSurveyPhoto] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isReschedulingSurvey, setIsReschedulingSurvey] = useState<SurveyRequest | null>(null);
    const [newSurveyDate, setNewSurveyDate] = useState('');
    const [newSurveyTime, setNewSurveyTime] = useState('');
    const [rescheduleReason, setRescheduleReason] = useState('');
    const checkIsKostManager = (r: any) => {
        if (!r) return false;
        const pType = (r.transaction?.product_type || r.transaction?.type || '').toLowerCase();
        return pType === 'kostmanager' || pType === 'kostmanager_subscription' || !!r.notes?.includes('KostManager');
    };

    const [isEditingKostManager, setIsEditingKostManager] = useState<SurveyRequest | null>(null);
    const [photoCategories, setPhotoCategories] = useState<string[]>(['Bangunan Depan', 'Koridor', 'Area Parkir', 'Lingkungan']);
    const [newPhotoCategoryName, setNewPhotoCategoryName] = useState('');
    const [googleMapsUrlInput, setGoogleMapsUrlInput] = useState('');
    const [showAddLandmarkForm, setShowAddLandmarkForm] = useState(false);
    const [activeRoomIdx, setActiveRoomIdx] = useState<number | null>(null);
    const openedRoomSnapshotRef = useRef<string | null>(null);
    const [temporaryRoom, setTemporaryRoom] = useState<any | null>(null);
    const [deleteRoomConfirm, setDeleteRoomConfirm] = useState<{ open: boolean; idx: number | null }>({ open: false, idx: null });
    const [customRoomFacilityInput, setCustomRoomFacilityInput] = useState('');
    const [customBathroomFacilityInput, setCustomBathroomFacilityInput] = useState('');
    const [customPublicKitchenFacilityInput, setCustomPublicKitchenFacilityInput] = useState('');
    const [customKitchenFacilityInput, setCustomKitchenFacilityInput] = useState('');
    const [customPublicBathroomFacilityInput, setCustomPublicBathroomFacilityInput] = useState('');
    const [customPublicParkingFacilityInput, setCustomPublicParkingFacilityInput] = useState('');
    const [newRoomPhotoCategoryName, setNewRoomPhotoCategoryName] = useState('');

    const [landmarkLocation, setLandmarkLocation] = useState<{ lat: number; lng: number }>({ lat: -5.147665, lng: 119.432731 });
    const kmLandmarkMapRef = useRef<HTMLDivElement>(null);
    const kmLandmarkMapInstance = useRef<any>(null);
    const kmLandmarkMarkerInstance = useRef<any>(null);
    const [kmStep, setKmStep] = useState<number>(1);
    const [mitraProfile, setMitraProfile] = useState<any>(null);
    const [signatureData, setSignatureData] = useState<string | null>(null);
    const [agreedToTerms, setAgreedToTerms] = useState<boolean>(false);
    const [expandedRoomIdx, setExpandedRoomIdx] = useState<number | null>(null);
    const [activePhotoIdx, setActivePhotoIdx] = useState<number>(0);
    const [isDrawing, setIsDrawing] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Helper to dynamically normalize and separate public facilities & sub-facilities (Mitra & KostManager synchronization)
    const normalizeAndExtractPublicFacilities = (
        rawFacilities: string[] = [],
        existingKitchen: string[] = [],
        existingParking: string[] = [],
        existingBathroom: string[] = []
    ) => {
        const kitchenSet = new Set<string>((existingKitchen || []).map(k => k.trim()).filter(Boolean));
        const parkingSet = new Set<string>((existingParking || []).map(p => p.trim()).filter(Boolean));
        const bathroomSet = new Set<string>((existingBathroom || []).map(b => b.trim()).filter(Boolean));
        const mainFacilitiesSet = new Set<string>();

        const kitchenMap: Record<string, string> = {
            'kompor': 'Kompor',
            'kulkas': 'Kulkas',
            'kulkas bersama': 'Kulkas',
            'kulkas umum': 'Kulkas',
            'dispenser': 'Dispenser',
            'dispenser air': 'Dispenser',
            'wastafel cuci piring': 'Wastafel Cuci Piring',
            'wastafel dapur': 'Wastafel Cuci Piring',
            'peralatan masak': 'Peralatan Masak',
            'meja makan': 'Meja Makan',
            'meja makan bersama': 'Meja Makan'
        };

        const parkingMap: Record<string, string> = {
            'parkir motor': 'Parkir Motor',
            'parkir mobil': 'Parkir Mobil',
            'parkir sepeda': 'Parkir Sepeda'
        };

        const bathroomMap: Record<string, string> = {
            'kloset duduk': 'Kloset Duduk',
            'kloset jongkok': 'Kloset Jongkok',
            'shower': 'Shower',
            'wastafel': 'Wastafel',
            'wastafel wc': 'Wastafel'
        };

        const standardMainMap: Record<string, string> = {
            'wifi': 'WiFi',
            'wi-fi': 'WiFi',
            'internet': 'WiFi',
            'area parkir': 'Area Parkir',
            'parkir': 'Area Parkir',
            'parkiran': 'Area Parkir',
            'tempat parkir': 'Area Parkir',
            'dapur': 'Dapur Bersama',
            'dapur bersama': 'Dapur Bersama',
            'dapur umum': 'Dapur Bersama',
            'wc umum': 'WC Umum',
            'toilet umum': 'WC Umum',
            'kamar mandi luar': 'WC Umum',
            'wc luar': 'WC Umum',
            'ruang tamu': 'Ruang Tamu',
            'ruang santai': 'Ruang Tamu',
            'cctv': 'CCTV',
            'kamera keamanan': 'CCTV',
            'laundry': 'Laundry',
            'mesin cuci': 'Laundry',
            'cuci': 'Laundry',
            'mushola': 'Mushola',
            'musholla': 'Mushola',
            'area jemuran': 'Area Jemuran',
            'jemuran': 'Area Jemuran',
            'tempat jemuran': 'Area Jemuran',
            'security 24 jam': 'Security 24 Jam',
            'security': 'Security 24 Jam',
            'satpam': 'Security 24 Jam',
            'penjaga kost': 'Security 24 Jam',
            'akses 24 jam': 'Akses 24 Jam',
            'bebas jam malam': 'Akses 24 Jam',
            '24 jam': 'Akses 24 Jam',
            'lift': 'Lift',
            'cleaning service': 'Cleaning Service',
            'pembersihan': 'Cleaning Service',
            'kebersihan': 'Cleaning Service'
        };

        (rawFacilities || []).forEach(item => {
            if (!item || typeof item !== 'string') return;
            const trimmed = item.trim();
            if (!trimmed) return;
            const lower = trimmed.toLowerCase();

            // 1. Kitchen sub-facility
            if (kitchenMap[lower]) {
                kitchenSet.add(kitchenMap[lower]);
                mainFacilitiesSet.add('Dapur Bersama');
                return;
            }

            // 2. Parking sub-facility
            if (parkingMap[lower]) {
                parkingSet.add(parkingMap[lower]);
                mainFacilitiesSet.add('Area Parkir');
                return;
            }

            // 3. Bathroom sub-facility
            if (bathroomMap[lower]) {
                bathroomSet.add(bathroomMap[lower]);
                mainFacilitiesSet.add('WC Umum');
                return;
            }

            // 4. Standard main facility
            if (standardMainMap[lower]) {
                mainFacilitiesSet.add(standardMainMap[lower]);
                return;
            }

            // 5. Custom facility
            mainFacilitiesSet.add(trimmed);
        });

        // If Area Parkir is selected but no parking sub-options chosen, default to 'Parkir Motor'
        if (mainFacilitiesSet.has('Area Parkir') && parkingSet.size === 0) {
            parkingSet.add('Parkir Motor');
        }

        return {
            facilities: Array.from(mainFacilitiesSet),
            publicKitchenFacilities: Array.from(kitchenSet),
            publicParkingFacilities: Array.from(parkingSet),
            publicBathroomFacilities: Array.from(bathroomSet)
        };
    };

    // Helper to dynamically compute public photo categories based on checked facilities and sub-facilities
    const computeDynamicPublicPhotoCategories = (
        facilities: string[] = [],
        manualExtras: string[] = [],
        parkingFacilities: string[] = [],
        kitchenFacilities: string[] = [],
        bathroomFacilities: string[] = []
    ): string[] => {
        const base = ['Bangunan Depan', 'Koridor', 'Lingkungan'];
        const dynamic: string[] = [];

        // 1. Area Parkir & Sub-facilities
        const hasParking = (facilities || []).some(f => {
            const l = (f || '').toLowerCase().trim();
            return l === 'area parkir' || l === 'parkir' || l === 'parkiran' || l === 'parkir motor' || l === 'parkir mobil';
        });
        if (hasParking) {
            if (parkingFacilities && parkingFacilities.length > 0) {
                parkingFacilities.forEach(pf => {
                    const clean = (pf || '').trim();
                    if (clean && !dynamic.includes(clean) && !base.includes(clean)) {
                        dynamic.push(clean);
                    }
                });
            } else {
                if (!dynamic.includes('Area Parkir')) {
                    dynamic.push('Area Parkir');
                }
            }
        }

        // 2. Dapur Bersama & Sub-facilities
        const hasKitchen = (facilities || []).some(f => {
            const l = (f || '').toLowerCase().trim();
            return l === 'dapur bersama' || l === 'dapur' || l === 'dapur umum';
        });
        if (hasKitchen) {
            if (!dynamic.includes('Dapur Bersama')) {
                dynamic.push('Dapur Bersama');
            }
            if (kitchenFacilities && kitchenFacilities.length > 0) {
                kitchenFacilities.forEach(kf => {
                    const clean = (kf || '').trim();
                    if (clean && !dynamic.includes(clean) && !base.includes(clean)) {
                        dynamic.push(clean);
                    }
                });
            }
        }

        // 3. WC Umum & Sub-facilities
        const hasBathroom = (facilities || []).some(f => {
            const l = (f || '').toLowerCase().trim();
            return l === 'wc umum' || l === 'kamar mandi umum' || l === 'toilet umum' || l === 'kamar mandi luar';
        });
        if (hasBathroom) {
            if (!dynamic.includes('WC Umum')) {
                dynamic.push('WC Umum');
            }
            if (bathroomFacilities && bathroomFacilities.length > 0) {
                bathroomFacilities.forEach(bf => {
                    const clean = (bf || '').trim();
                    if (clean && !dynamic.includes(clean) && !base.includes(clean)) {
                        dynamic.push(clean);
                    }
                });
            }
        }

        const facMapping: { [key: string]: string } = {
            'ruang tamu': 'Ruang Tamu',
            'cctv': 'CCTV',
            'laundry': 'Laundry',
            'mushola': 'Mushola',
            'musholla': 'Mushola',
            'area jemuran': 'Area Jemuran',
            'jemuran': 'Area Jemuran',
            'lift': 'Lift'
        };

        const nonPhotoFacs = [
            'wifi', 'wi-fi', 'internet', 'security 24 jam', 'security', 'satpam', 'penjaga kost',
            'akses 24 jam', 'bebas jam malam', '24 jam', 'cleaning service', 'pembersihan', 'kebersihan',
            'area parkir', 'parkir', 'parkiran', 'parkir motor', 'parkir mobil', 'parkir sepeda',
            'dapur bersama', 'dapur', 'dapur umum',
            'wc umum', 'kamar mandi umum', 'toilet umum', 'kamar mandi luar'
        ];

        (facilities || []).forEach(f => {
            const lower = (f || '').toLowerCase().trim();
            if (!lower || nonPhotoFacs.includes(lower)) return;
            const mapped = facMapping[lower];
            if (mapped) {
                if (!dynamic.includes(mapped) && !base.includes(mapped)) {
                    dynamic.push(mapped);
                }
            } else {
                const cleanName = f.trim();
                if (!dynamic.includes(cleanName) && !base.includes(cleanName) && cleanName !== 'Lingkungan') {
                    dynamic.push(cleanName);
                }
            }
        });

        (manualExtras || []).forEach(c => {
            const clean = (c || '').trim();
            if (clean && !dynamic.includes(clean) && !base.includes(clean)) {
                dynamic.push(clean);
            }
        });

        return [...base, ...dynamic];
    };

    // Top-level getImageUrlString helper
    const getImageUrlString = (img: any): string => {
        if (!img) return '';
        if (typeof img === 'string') return img;
        if (typeof img === 'object' && img.original) return img.original;
        if (typeof img === 'object' && img.url) return img.url;
        return '';
    };

    // Helper to get structured categorized photos from room or property object
    const getRoomCategorizedPhotos = (item: any): Record<string, string[]> => {
        if (!item) return {};
        const cleanUrls = (urls: any[]) => (urls || []).map((u: any) => getImageUrlString(u)).filter(Boolean);

        if (item.categorized_photos && typeof item.categorized_photos === 'object' && !Array.isArray(item.categorized_photos)) {
            const raw = JSON.parse(JSON.stringify(item.categorized_photos));
            const cleaned: Record<string, string[]> = {};
            Object.entries(raw).forEach(([k, urls]) => {
                if (Array.isArray(urls)) cleaned[k] = cleanUrls(urls);
            });
            return cleaned;
        }
        if (item.categorizedPhotos && typeof item.categorizedPhotos === 'object' && !Array.isArray(item.categorizedPhotos)) {
            const raw = JSON.parse(JSON.stringify(item.categorizedPhotos));
            const cleaned: Record<string, string[]> = {};
            Object.entries(raw).forEach(([k, urls]) => {
                if (Array.isArray(urls)) cleaned[k] = cleanUrls(urls);
            });
            return cleaned;
        }
        // Fallback from legacy parallel arrays
        const result: Record<string, string[]> = {};
        const images = Array.isArray(item.images) ? item.images : (Array.isArray(item.image_urls) ? item.image_urls : []);
        const categories = Array.isArray(item.photoCategories) ? item.photoCategories : [];
        images.forEach((urlItem: any, idx: number) => {
            const urlStr = getImageUrlString(urlItem);
            if (!urlStr) return;
            const cat = (typeof urlItem === 'object' && urlItem.label) 
                ? urlItem.label 
                : (categories[idx] || (idx === 0 ? 'Interior Kamar *Wajib' : 'Foto Kamar'));
            if (!result[cat]) result[cat] = [];
            result[cat].push(urlStr);
        });
        return result;
    };

    // Helper to export categorized photos into flat arrays for legacy database compatibility
    const exportCategorizedPhotos = (categorized: Record<string, string[]>) => {
        const images: string[] = [];
        const photoCategories: string[] = [];
        Object.entries(categorized || {}).forEach(([cat, urls]) => {
            if (Array.isArray(urls)) {
                urls.forEach(url => {
                    if (url) {
                        images.push(url);
                        photoCategories.push(cat);
                    }
                });
            }
        });
        return { images, photoCategories };
    };

    // Helper to dynamically compute room photo categories based on checked room facilities
    const computeDynamicRoomPhotoCategories = (roomFacilities: string[] = [], status: string = 'Kosong', manualExtras: string[] = []): string[] => {
        const baseLabel = status === 'Terisi' ? 'Interior Kamar (Opsional)' : 'Interior Kamar *Wajib';
        const categories: string[] = [baseLabel];

        const facilityPhotoMapping: { [key: string]: string } = {
            'kamar mandi dalam': 'Kamar Mandi',
            'dapur dalam': 'Dapur Dalam',
            'kasur': 'Tempat Tidur',
            'lemari': 'Lemari / Storage',
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
    const [newFacilityName, setNewFacilityName] = useState('');
    const [newRuleName, setNewRuleName] = useState('');
    const [newLandmarkName, setNewLandmarkName] = useState('');
    const [landmarkInputMethod, setLandmarkInputMethod] = useState<'search' | 'gmaps'>('search');
    const [landmarkSuggestions, setLandmarkSuggestions] = useState<any[]>([]);

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
    const [uploadingPublicAreas, setUploadingPublicAreas] = useState<Record<number, boolean>>({});
    const [requestsCoords, setRequestsCoords] = useState<Record<string, { lat: number; lng: number }>>({});

    useEffect(() => {
        if (!surveyRequests || surveyRequests.length === 0) return;
        
        const fetchCoords = async () => {
            const newCoords: Record<string, { lat: number; lng: number }> = {};

            // 1. Sync from localStorage drafts first (Instant prefill if agent has opened the listing form)
            surveyRequests.forEach(req => {
                if (requestsCoords[req.id]) return;
                try {
                    // Try KostManager draft
                    const kmDraftKey = 'km_draft_' + req.id;
                    const kmDraft = localStorage.getItem(kmDraftKey);
                    if (kmDraft) {
                        const parsed = JSON.parse(kmDraft);
                        const loc = parsed?.kmListingForm?.location;
                        if (loc?.lat && loc?.lng) {
                            newCoords[req.id] = { lat: Number(loc.lat), lng: Number(loc.lng) };
                            return;
                        }
                    }
                    
                    // Try regular survey draft
                    const surveyDraftKey = 'survey_draft_' + req.id;
                    const surveyDraft = localStorage.getItem(surveyDraftKey);
                    if (surveyDraft) {
                        const parsed = JSON.parse(surveyDraft);
                        if (parsed?.latitude && parsed?.longitude) {
                            newCoords[req.id] = { lat: Number(parsed.latitude), lng: Number(parsed.longitude) };
                            return;
                        }
                    }
                } catch (e) {
                    console.warn("Failed to parse draft from localStorage:", e);
                }
            });

            // 2. Identify remaining requests that need database query lookup
            const missingReqs = surveyRequests.filter(req => {
                const isKostManager = checkIsKostManager(req);
                if (!isKostManager) return false;
                if (requestsCoords[req.id] || newCoords[req.id]) return false;
                
                const meta = req.transaction?.metadata || {};
                const lat = meta.location?.lat || meta.latitude || (req as any).latitude;
                const lng = meta.location?.lng || meta.longitude || (req as any).longitude;
                if (!lat || !lng) return true;
                
                const isDefaultMakassar = Math.abs(lat - (-5.147665)) < 0.0001 && Math.abs(lng - 119.432731) < 0.0001;
                return isDefaultMakassar;
            });
            
            if (missingReqs.length === 0) {
                if (Object.keys(newCoords).length > 0) {
                    setRequestsCoords(prev => ({ ...prev, ...newCoords }));
                }
                return;
            }
            
            try {
                await Promise.all(missingReqs.map(async (req) => {
                    if (!req.user_id) return;
                    
                    // A. Try mitra_kostmanager table query
                    try {
                        const { data: kmProps } = await supabase
                            .from('mitra_kostmanager')
                            .select('location')
                            .eq('owner_uid', req.user_id)
                            .limit(1);
                            
                        if (kmProps && kmProps.length > 0 && kmProps[0].location) {
                            let loc = kmProps[0].location;
                            if (typeof loc === 'string') {
                                try { loc = JSON.parse(loc); } catch (e) {}
                            }
                            if (loc && loc.lat && loc.lng) {
                                newCoords[req.id] = { lat: Number(loc.lat), lng: Number(loc.lng) };
                                return; // Found, skip properties query
                            }
                        }
                    } catch (e) {
                        console.warn("mitra_kostmanager query error:", e);
                    }

                    // B. Try properties table query fallback
                    try {
                        const { data: props } = await supabase
                            .from('properties')
                            .select('location')
                            .eq('owner_uid', req.user_id);
                            
                        if (props && props.length > 0) {
                            const prop = props[0]; // fallback to the first property
                            if (prop.location) {
                                let loc = prop.location;
                                if (typeof loc === 'string') {
                                    try { loc = JSON.parse(loc); } catch (e) {}
                                }
                                if (loc && loc.lat && loc.lng) {
                                    newCoords[req.id] = { lat: Number(loc.lat), lng: Number(loc.lng) };
                                }
                            }
                        }
                    } catch (e) {
                        console.warn("properties query error:", e);
                    }
                }));
                
                if (Object.keys(newCoords).length > 0) {
                    setRequestsCoords(prev => ({ ...prev, ...newCoords }));
                }
            } catch (err) {
                console.error("Error fetching coordinates from tables:", err);
            }
        };
        
        fetchCoords();
    }, [surveyRequests, requestsCoords]);

    const [kmListingForm, setKmListingForm] = useState<any>({
        title: '',
        description: '',
        address: '',
        city: 'Makassar',
        area: '',
        type: 'Campur',
        price: 0,
        owner_uid: '',
        roomTypes: [],
        publicBathroomFacilities: [],
        publicKitchenFacilities: [],
        publicParkingFacilities: ['Parkir Motor'],
        facilities: ['WiFi', 'Area Parkir', 'Dapur Bersama'],
        location: { lat: -5.147665, lng: 119.432731 },
        rules: ['Tidak boleh membawa hewan peliharaan', 'Tamu dilarang menginap'],
        image_urls: [],
        campuses: []
    });
    const [kmActiveTab, setKmActiveTab] = useState<'info' | 'rooms'>('info');
    const [isExistingPropertyMigration, setIsExistingPropertyMigration] = useState(false);
    const [warningAccepted, setWarningAccepted] = useState(false);
    const hasAutoGeocodedRef = useRef<Record<string, boolean>>({});

    const [isScanningLandmarks, setIsScanningLandmarks] = useState(false);
    const landmarkScanAbortRef = useRef<number>(0);
    const [isSearchingFacility, setIsSearchingFacility] = useState<Record<string, boolean>>({});
    const [reScanningPhotoUrl, setReScanningPhotoUrl] = useState<string | null>(null);
    const [kmBannerNotice, setKmBannerNotice] = useState<string | null>(null);
    const [sensorModalData, setSensorModalData] = useState<{
        isOpen: boolean;
        imageUrl: string;
        category: string;
        photoIndex: number;
        roomIndex?: number;
        roomPhotoIndex?: number;
    } | null>(null);

    const handleOpenSensorModal = (photoIndex: number, currentUrl: string, category: string, roomIndex?: number, roomPhotoIndex?: number) => {
        setSensorModalData({
            isOpen: true,
            imageUrl: currentUrl,
            category,
            photoIndex,
            roomIndex,
            roomPhotoIndex
        });
    };

    const handleApplySensorModal = async (newUrl: string) => {
        if (!sensorModalData) return;
        const { photoIndex, category, roomIndex, roomPhotoIndex } = sensorModalData;

        if (roomIndex !== undefined && roomPhotoIndex !== undefined) {
            const updatedRooms = [...(kmListingForm.room_types || [])];
            if (updatedRooms[roomIndex]) {
                const rImages = [...(updatedRooms[roomIndex].image_urls || [])];
                rImages[roomPhotoIndex] = newUrl;
                updatedRooms[roomIndex].image_urls = rImages;
                setKmListingForm((prev: any) => ({ ...prev, room_types: updatedRooms }));
            }
        } else {
            const updatedImages = [...(kmListingForm.image_urls || [])];
            updatedImages[photoIndex] = newUrl;
            setKmListingForm((prev: any) => ({ ...prev, image_urls: updatedImages }));
        }

        setKmBannerNotice(`✅ Area spanduk / kontak pada foto "${category}" berhasil disensor & diperbarui!`);
        setTimeout(() => setKmBannerNotice(null), 6000);
    };

    const handleReScanPublicPhoto = async (photoIndex: number, currentUrl: string, category: string) => {
        handleOpenSensorModal(photoIndex, currentUrl, category);
    };

    const isInvalidCampus = (name: string) => {
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
    };

    // Helper sanitasi global multi-layer: menolak tempat usaha non-fasilitas publik kost (printer, servis, fotocopy, bengkel, konter, dll.)
    const isGarbageFacility = (name: string) => {
        if (!name) return false;
        const lower = name.toLowerCase().trim();

        // Tolak mutlak jika namanya hanya "mobil", "mobil 1", dsb. tanpa kata spbu/indostation/pom
        if (lower === 'mobil' || lower === 'mobil 1' || lower === 'mobil satu') return true;
        if (lower.startsWith('mobil ') && !lower.includes('spbu') && !lower.includes('pom') && !lower.includes('indostation') && !lower.includes('bensin')) return true;

        const garbageKeywords = [
            'printer', 'service', 'servis', 'print',
            'fotocopy', 'foto copy', 'percetakan', 'copy center',
            'cuci motor', 'cuci mobil', 'car wash', 'steam',
            'bengkel', 'tambal ban', 'sparepart', 'variasi motor', 'variasi mobil',
            'rental mobil', 'sewa mobil', 'rent car', 'showroom',
            'counter pulsa', 'konter', 'cell', 'elektronik',
            'salon', 'barber', 'barbershop', 'pijat', 'massage', 'spa',
            'bintang khalifah', 'toko baju', 'toko pakaian', 'toko busana', 'toko kain',
            'toko plastik', 'toko bangunan', 'toko beras', 'toko emas', 'toko jam',
            'warung sembako', 'agen beras', 'distributor', 'paud', 'kb '
        ];
        return garbageKeywords.some(b => lower.includes(b));
    };

    // Helper validasi sanitasi nama & kategori fasilitas mikro (mencegah false-positive seperti "Service Printer", "Cuci Motor", "Bengkel", "Mobil", "Bintang khalifah")
    const isValidMicroFacility = (category: 'minimarket' | 'laundry' | 'mosque' | 'church' | 'gas_station', place: any) => {
        if (!place?.name) return false;
        const name = place.name.toLowerCase().trim();
        const types: string[] = place.types || [];

        if (category === 'laundry') {
            const validKeywords = ['laundry', 'loundry', 'cuci', 'wash', 'kiloan', 'dry clean', 'setrika'];
            const hasKeyword = validKeywords.some(k => name.includes(k));
            if (!hasKeyword && !types.includes('laundry')) return false;

            const blacklist = [
                'printer', 'service', 'servis', 'fotocopy', 'foto copy', 'percetakan', 'print',
                'cuci motor', 'cuci mobil', 'car wash', 'steam', 'bengkel', 'tambal ban',
                'counter', 'pulsa', 'cell', 'helm', 'sepatu', 'elektronik'
            ];
            return !blacklist.some(b => name.includes(b));
        }

        if (category === 'minimarket') {
            // Wajib mengandung nama ritel minimarket terverifikasi atau kata minimarket/swalayan
            const validKeywords = [
                'indomaret', 'alfamart', 'alfamidi', 'circle k', 'family mart', 'familymart',
                'lawson', 'super indo', 'superindo', 'hypermart', 'minimarket', 'mini market',
                'swalayan'
            ];
            const hasRetailKeyword = validKeywords.some(k => name.includes(k)) || name.endsWith(' mart') || name.includes(' mart ');
            // hasType saja TIDAK BOLEH meloloskan tempat jika namanya tidak cocok ritel minimarket
            if (!hasRetailKeyword) return false;

            // Blacklist nama usaha non-minimarket/toko umum
            const blacklist = [
                'service', 'printer', 'bengkel', 'laundry', 'fotocopy', 'salon', 'barber',
                'apotek', 'counter', 'pulsa', 'bintang', 'khalifah', 'busana', 'pakaian',
                'baju', 'bangunan', 'plastik', 'emas', 'kacamata', 'distributor', 'grosir',
                'warung', 'kios', 'sembako'
            ];
            return !blacklist.some(b => name.includes(b));
        }

        if (category === 'mosque') {
            const validKeywords = ['masjid', 'musholla', 'mushola', 'mesjid', 'surau', 'islamic center'];
            const hasKeyword = validKeywords.some(k => name.includes(k));
            const hasType = types.includes('mosque');
            if (!hasKeyword && !hasType) return false;

            if (name.includes('travel') || name.includes('tour') || name.includes('yayasan') || name.includes('sekolah')) return false;
            return true;
        }

        if (category === 'church') {
            const validKeywords = [
                'gereja', 'church', 'katedral', 'paroki', 'kapel', 'chapel', 'gki', 'gbi',
                'hkbp', 'gpdi', 'bethel', 'pantekosta', 'toraja', 'katolik', 'kristen', 'advent'
            ];
            const hasKeyword = validKeywords.some(k => name.includes(k));
            const hasType = types.some(t => ['church', 'place_of_worship'].includes(t));
            return hasKeyword || hasType;
        }

        if (category === 'gas_station') {
            // Tolak mutlak jika namanya hanya "mobil" atau varian kendaraan/rental
            if (name === 'mobil' || name === 'mobil 1' || name === 'mobil satu') return false;
            if (name.startsWith('mobil ') && !name.includes('spbu') && !name.includes('pom') && !name.includes('indostation') && !name.includes('bensin')) return false;

            // Wajib mengandung kata kunci SPBU resmi
            const validKeywords = ['spbu', 'pertamina', 'shell', 'bp ', 'bp-', 'pom bensin', 'vivo', 'indostation'];
            const hasKeyword = validKeywords.some(k => name.includes(k));
            if (!hasKeyword) return false;

            // Tolak kios bensin eceran/botolan
            if (name.includes('pertamini') || name.includes('eceran') || name.includes('pom mini')) return false;

            // Tolak usaha otomotif/rental/cuci
            const blacklist = ['rental', 'sewa mobil', 'cuci', 'bengkel', 'variasi', 'salon', 'showroom', 'onderdil', 'sparepart', 'service', 'servis'];
            if (blacklist.some(b => name.includes(b))) return false;

            return true;
        }

        return true;
    };

    const enrichLandmarksWithGoogleDistanceMatrix = (centerLat: number, centerLng: number, landmarksToEnrich: any[]) => {
        const google = (window as any).google;
        if (!google?.maps?.DistanceMatrixService || !centerLat || !centerLng) return;
        if (!landmarksToEnrich || landmarksToEnrich.length === 0) return;

        try {
            const matrixService = new google.maps.DistanceMatrixService();
            const origin = new google.maps.LatLng(centerLat, centerLng);

            const validLandmarks = landmarksToEnrich.filter((c: any) => c.lat && c.lng);
            if (validLandmarks.length === 0) return;

            const destinations = validLandmarks.map((c: any) => new google.maps.LatLng(c.lat, c.lng));

            const fetchMatrix = (mode: any): Promise<{ status: string; response: any }> => {
                return new Promise((resolve) => {
                    matrixService.getDistanceMatrix(
                        {
                            origins: [origin],
                            destinations: destinations,
                            travelMode: mode,
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

                setKmListingForm((prev: any) => {
                    const currentCampuses = [...(prev.campuses || [])];
                    let hasChange = false;

                    validLandmarks.forEach((vl: any, idx: number) => {
                        const dEl = drivingElements[idx];
                        const wEl = walkingElements[idx];

                        const targetIdx = currentCampuses.findIndex((c: any) => c.name === vl.name || (c.lat === vl.lat && c.lng === vl.lng));
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
                console.warn('[DistanceMatrixService Agent] Error:', err);
            });
        } catch (e) {
            console.error('[DistanceMatrixService Agent] Init error:', e);
        }
    };

    const detectNearbyLandmarks = (centerLat: number, centerLng: number) => {
        if (!centerLat || !centerLng) return;

        const scanId = Date.now();
        landmarkScanAbortRef.current = scanId;

        const getKm = (pLat: number, pLng: number) => {
            return calculateHaversineDistance(centerLat, centerLng, pLat, pLng);
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
                category: c.category,
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
                category: c.category,
                transportMode: c.transportMode,
                isLiveGoogleApi: true
            }));

        // LANGSUNG PERBARUI STATE FORM SECARA SINKRON (0ms) DENGAN MASTER DATA MURNI
        const initialCombined = [...curatedCampuses, ...curatedOthers];
        if (initialCombined.length > 0) {
            setKmListingForm((prev: any) => ({
                ...prev,
                campuses: initialCombined.map(({ kmVal, ...item }: any) => item)
            }));
        }

        // 2. CEK KETERSEDIAAN GOOGLE PLACES API UNTUK SCAN FASILITAS MIKRO (Minimarket, Laundry, Tempat Ibadah, SPBU)
        const google = (window as any).google;
        if (!google?.maps?.places?.PlacesService) {
            setIsScanningLandmarks(false);
            return;
        }

        setIsScanningLandmarks(true);

        const tempDiv = document.createElement('div');
        const service = new google.maps.places.PlacesService(tempDiv);
        const centerLatLng = new google.maps.LatLng(centerLat, centerLng);

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
                            category: 'campus',
                            transportMode: km <= 1.0 ? 'walk' : 'motorcycle',
                            isLiveGoogleApi: true
                        };
                    })
                    .sort((a, b) => b.popularityScore - a.popularityScore)
                    .slice(0, 3);
            });

        // 4. Scan Fasilitas Harian Mikro: Minimarket Terdekat (Prioritas Ritel Nasional Terverifikasi)
        const searchMini1 = performSearch({
            location: centerLatLng,
            rankBy: google.maps.places.RankBy.DISTANCE,
            keyword: 'indomaret'
        });
        const searchMini2 = performSearch({
            location: centerLatLng,
            rankBy: google.maps.places.RankBy.DISTANCE,
            keyword: 'alfamart'
        });
        const searchMini3 = performSearch({
            location: centerLatLng,
            rankBy: google.maps.places.RankBy.DISTANCE,
            keyword: 'alfamidi'
        });
        const searchMini4 = performSearch({
            location: centerLatLng,
            rankBy: google.maps.places.RankBy.DISTANCE,
            keyword: 'minimarket'
        });

        const scanMinimarket = Promise.all([searchMini1, searchMini2, searchMini3, searchMini4]).then(([r1, r2, r3, r4]) => {
            const combined = [...r1, ...r2, ...r3, ...r4];
            const seen = new Set<string>();
            const mapped = combined
                .filter(p => {
                    if (!p.name || !p.geometry?.location) return false;
                    if (!isValidMicroFacility('minimarket', p)) return false;
                    if (isGarbageFacility(p.name)) return false;
                    const key = p.place_id || `${p.name}_${p.geometry.location.lat().toFixed(4)}_${p.geometry.location.lng().toFixed(4)}`;
                    if (seen.has(key)) return false;
                    seen.add(key);
                    return true;
                })
                .map(p => {
                    const pLat = p.geometry.location.lat();
                    const pLng = p.geometry.location.lng();
                    const km = getKm(pLat, pLng);
                    const lowerName = p.name.toLowerCase();
                    // Tier 1: Ritel nasional terverifikasi
                    const isTier1 = ['indomaret', 'alfamart', 'alfamidi', 'circle k', 'familymart', 'family mart', 'lawson', 'super indo', 'superindo'].some(brand => lowerName.includes(brand));
                    return {
                        name: p.name,
                        lat: pLat,
                        lng: pLng,
                        distance: `± ${km} KM`,
                        kmVal: km,
                        category: 'minimarket',
                        isTier1,
                        transportMode: km <= 1.0 ? 'walk' : 'motorcycle',
                        isLiveGoogleApi: true
                    };
                })
                .filter(p => p.kmVal <= 3.5);

            // Jika ada minimarket ritel Tier 1 (Indomaret/Alfamart/Alfamidi), prioritaskan yang paling dekat
            const tier1Items = mapped.filter(p => p.isTier1).sort((a, b) => a.kmVal - b.kmVal);
            if (tier1Items.length > 0) {
                return tier1Items.slice(0, 1);
            }

            return mapped.sort((a, b) => a.kmVal - b.kmVal).slice(0, 1);
        });

        // 5. Scan Fasilitas Harian Mikro: Laundry Kiloan Terdekat
        const scanLaundry = performSearch({
            location: centerLatLng,
            rankBy: google.maps.places.RankBy.DISTANCE,
            keyword: 'laundry'
        }).then(results => {
            return results
                .filter(p => p.name && p.geometry?.location && isValidMicroFacility('laundry', p) && !isGarbageFacility(p.name))
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
                        category: 'laundry',
                        transportMode: km <= 1.0 ? 'walk' : 'motorcycle',
                        isLiveGoogleApi: true
                    };
                })
                .filter(p => p.kmVal <= 3.0)
                .sort((a, b) => a.kmVal - b.kmVal)
                .slice(0, 1);
        });

        // 6. Scan Fasilitas Harian Mikro: Masjid / Musholla Terdekat
        const searchMosque1 = performSearch({
            location: centerLatLng,
            rankBy: google.maps.places.RankBy.DISTANCE,
            keyword: 'masjid'
        });
        const searchMosque2 = performSearch({
            location: centerLatLng,
            rankBy: google.maps.places.RankBy.DISTANCE,
            type: 'mosque'
        });

        const scanMosque = Promise.all([searchMosque1, searchMosque2]).then(([r1, r2]) => {
            const combined = [...r1, ...r2];
            const seen = new Set<string>();
            return combined
                .filter(p => {
                    if (!p.name || !p.geometry?.location) return false;
                    if (!isValidMicroFacility('mosque', p)) return false;
                    if (isGarbageFacility(p.name)) return false;
                    const key = p.place_id || `${p.name}_${p.geometry.location.lat().toFixed(4)}_${p.geometry.location.lng().toFixed(4)}`;
                    if (seen.has(key)) return false;
                    seen.add(key);
                    return true;
                })
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
                        category: 'mosque',
                        transportMode: km <= 1.0 ? 'walk' : 'motorcycle',
                        isLiveGoogleApi: true
                    };
                })
                .filter(p => p.kmVal <= 2.5)
                .sort((a, b) => a.kmVal - b.kmVal)
                .slice(0, 1);
        });

        // 7. Scan Fasilitas Harian Mikro: Gereja Terdekat
        const searchChurch1 = performSearch({
            location: centerLatLng,
            rankBy: google.maps.places.RankBy.DISTANCE,
            keyword: 'gereja'
        });
        const searchChurch2 = performSearch({
            location: centerLatLng,
            rankBy: google.maps.places.RankBy.DISTANCE,
            type: 'church'
        });

        const scanChurch = Promise.all([searchChurch1, searchChurch2]).then(([r1, r2]) => {
            const combined = [...r1, ...r2];
            const seen = new Set<string>();
            return combined
                .filter(p => {
                    if (!p.name || !p.geometry?.location) return false;
                    if (!isValidMicroFacility('church', p)) return false;
                    if (isGarbageFacility(p.name)) return false;
                    const key = p.place_id || `${p.name}_${p.geometry.location.lat().toFixed(4)}_${p.geometry.location.lng().toFixed(4)}`;
                    if (seen.has(key)) return false;
                    seen.add(key);
                    return true;
                })
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
                        category: 'church',
                        transportMode: km <= 1.0 ? 'walk' : 'motorcycle',
                        isLiveGoogleApi: true
                    };
                })
                .filter(p => p.kmVal <= 3.5)
                .sort((a, b) => a.kmVal - b.kmVal)
                .slice(0, 1);
        });

        // 8. Scan Fasilitas Vital: SPBU / Pom Bensin Terdekat (Prioritas SPBU Resmi Pertamina/Shell/BP)
        const searchSpbu1 = performSearch({
            location: centerLatLng,
            rankBy: google.maps.places.RankBy.DISTANCE,
            keyword: 'spbu'
        });
        const searchSpbu2 = performSearch({
            location: centerLatLng,
            rankBy: google.maps.places.RankBy.DISTANCE,
            keyword: 'pertamina'
        });
        const searchSpbu3 = performSearch({
            location: centerLatLng,
            rankBy: google.maps.places.RankBy.DISTANCE,
            type: 'gas_station'
        });

        const scanGasStation = Promise.all([searchSpbu1, searchSpbu2, searchSpbu3]).then(([r1, r2, r3]) => {
            const combined = [...r1, ...r2, ...r3];
            const seen = new Set<string>();
            const mapped = combined
                .filter(p => {
                    if (!p.name || !p.geometry?.location) return false;
                    if (!isValidMicroFacility('gas_station', p)) return false;
                    if (isGarbageFacility(p.name)) return false;
                    const key = p.place_id || `${p.name}_${p.geometry.location.lat().toFixed(4)}_${p.geometry.location.lng().toFixed(4)}`;
                    if (seen.has(key)) return false;
                    seen.add(key);
                    return true;
                })
                .map(p => {
                    const pLat = p.geometry.location.lat();
                    const pLng = p.geometry.location.lng();
                    const km = getKm(pLat, pLng);
                    const lowerName = p.name.toLowerCase();
                    // Tier 1: SPBU resmi utama (Pertamina, Shell, BP, Vivo atau diawali 'SPBU')
                    const isTier1 = ['pertamina', 'shell', 'bp ', 'bp-', 'vivo'].some(brand => lowerName.includes(brand)) || lowerName.startsWith('spbu');
                    return {
                        name: p.name,
                        lat: pLat,
                        lng: pLng,
                        distance: `± ${km} KM`,
                        kmVal: km,
                        category: 'gas_station',
                        isTier1,
                        transportMode: 'motorcycle',
                        isLiveGoogleApi: true
                    };
                })
                .filter(p => p.kmVal <= 5.0);

            // Jika ada SPBU resmi Tier 1 (Pertamina/Shell/BP), utamakan yang terdekat
            const tier1Items = mapped.filter(p => p.isTier1).sort((a, b) => a.kmVal - b.kmVal);
            if (tier1Items.length > 0) {
                return tier1Items.slice(0, 1);
            }

            return mapped.sort((a, b) => a.kmVal - b.kmVal).slice(0, 1);
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

            const finalCampuses = curatedCampuses.length > 0 
                ? [...curatedCampuses] 
                : [...fallbackCampuses];

            const finalFacilities = [
                ...curatedOthers,
                ...minimarketList,
                ...laundryList,
                ...gasStationList,
                ...mosqueList,
                ...churchList
            ];

            const cleanFinalFacilities = finalFacilities.filter(fac => !isGarbageFacility(fac.name));
            const combinedLandmarks = [...finalCampuses.filter(c => !isGarbageFacility(c.name))];
            cleanFinalFacilities.forEach(fac => {
                const exists = combinedLandmarks.some((c: any) => 
                    c.name.toLowerCase() === fac.name.toLowerCase() ||
                    (c.lat === fac.lat && c.lng === fac.lng)
                );
                if (!exists) {
                    combinedLandmarks.push(fac);
                }
            });

            const cleanCombinedLandmarks = combinedLandmarks.filter((c: any) => !isGarbageFacility(c.name));

            if (cleanCombinedLandmarks.length > 0) {
                setKmListingForm((prev: any) => ({
                    ...prev,
                    campuses: cleanCombinedLandmarks.map(({ kmVal, ...item }: any) => item)
                }));

                // Langsung hitung rute nyata Google Maps via DistanceMatrixService
                enrichLandmarksWithGoogleDistanceMatrix(centerLat, centerLng, cleanCombinedLandmarks);
            }
        }).catch(() => {
            if (landmarkScanAbortRef.current === scanId) {
                setIsScanningLandmarks(false);
            }
        });
    };

    const searchFacilityCoordinates = (index: number, name: string) => {
        if (!name) return;
        const stateKey = `campuses-${index}`;
        setIsSearchingFacility(prev => ({ ...prev, [stateKey]: true }));
        const gw = (window as any).google;
        if (!gw?.maps?.Geocoder) {
            setIsSearchingFacility(prev => ({ ...prev, [stateKey]: false }));
            alert('Google Maps belum siap.');
            return;
        }
        const geocoder = new gw.maps.Geocoder();
        const cityContext = kmListingForm.city ? `, ${kmListingForm.city}` : '';
        const provinceContext = kmListingForm.province ? `, ${kmListingForm.province}` : '';
        const queryAddress = `${name}${cityContext}${provinceContext}, Indonesia`;
        
        geocoder.geocode(
            { address: queryAddress, componentRestrictions: { country: 'ID' } },
            (results: any[], status: string) => {
                if (status === 'OK' && results && results.length > 0) {
                    const loc = results[0].geometry.location;
                    const lat = loc.lat(), lng = loc.lng();
                    const arr = [...(kmListingForm.campuses || [])];
                    
                    let distString = arr[index]?.distance;
                    if (kmListingForm.location && kmListingForm.location.lat) {
                        const km = calculateHaversineDistance(kmListingForm.location.lat, kmListingForm.location.lng, lat, lng);
                        distString = `± ${km} KM`;
                    }

                    arr[index] = { ...arr[index], lat, lng, distance: distString };
                    setKmListingForm((prev: any) => ({ ...prev, campuses: arr }));
                    setIsSearchingFacility(prev => ({ ...prev, [stateKey]: false }));

                    if (kmListingForm.location?.lat && kmListingForm.location?.lng) {
                        enrichLandmarksWithGoogleDistanceMatrix(kmListingForm.location.lat, kmListingForm.location.lng, [arr[index]]);
                    }
                } else {
                    geocoder.geocode(
                        { address: name + ', Indonesia', componentRestrictions: { country: 'ID' } },
                        (fallbackResults: any[], fallbackStatus: string) => {
                            if (fallbackStatus === 'OK' && fallbackResults && fallbackResults.length > 0) {
                                const loc = fallbackResults[0].geometry.location;
                                const lat = loc.lat(), lng = loc.lng();
                                const arr = [...(kmListingForm.campuses || [])];
                                
                                let distString = arr[index]?.distance;
                                if (kmListingForm.location && kmListingForm.location.lat) {
                                    const km = calculateHaversineDistance(kmListingForm.location.lat, kmListingForm.location.lng, lat, lng);
                                    distString = `± ${km} KM`;
                                }

                                arr[index] = { ...arr[index], lat, lng, distance: distString };
                                setKmListingForm((prev: any) => ({ ...prev, campuses: arr }));

                                if (kmListingForm.location?.lat && kmListingForm.location?.lng) {
                                    enrichLandmarksWithGoogleDistanceMatrix(kmListingForm.location.lat, kmListingForm.location.lng, [arr[index]]);
                                }
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

    // Auto-sync & auto-purge master landmarks saat step lokasi aktif jika campuses kosong atau memuat data sampah
    useEffect(() => {
        if (kmStep === 1 && isEditingKostManager && kmListingForm.location?.lat && kmListingForm.location?.lng) {
            const currentCampuses = kmListingForm.campuses || [];
            const hasGarbage = currentCampuses.some((c: any) => 
                isInvalidCampus(c.name) || 
                isGarbageFacility(c.name) ||
                c.name.toLowerCase().includes('full bright')
            );
            if (hasGarbage) {
                setKmListingForm((prev: any) => ({
                    ...prev,
                    campuses: (prev.campuses || []).filter((c: any) => !isGarbageFacility(c.name) && !isInvalidCampus(c.name))
                }));
            }
            if (currentCampuses.length === 0) {
                detectNearbyLandmarks(kmListingForm.location.lat, kmListingForm.location.lng);
            }
        }
    }, [kmStep, isEditingKostManager, kmListingForm.location?.lat, kmListingForm.location?.lng]);

    // Step 1: Automatically sync public photo categories when facilities change
    useEffect(() => {
        if (isEditingKostManager) {
            const dynamicPublicCats = computeDynamicPublicPhotoCategories(
                kmListingForm.facilities || [],
                [],
                kmListingForm.publicParkingFacilities || [],
                kmListingForm.publicKitchenFacilities || [],
                kmListingForm.publicBathroomFacilities || []
            );
            setPhotoCategories(prev => {
                const manualExtras = prev.filter(c => !dynamicPublicCats.includes(c) && !['Bangunan Depan', 'Koridor', 'Lingkungan', 'Area Parkir', 'Parkiran', 'Dapur Bersama', 'Ruang Tamu', 'WC Umum', 'CCTV', 'Laundry'].includes(c));
                return computeDynamicPublicPhotoCategories(
                    kmListingForm.facilities || [],
                    manualExtras,
                    kmListingForm.publicParkingFacilities || [],
                    kmListingForm.publicKitchenFacilities || [],
                    kmListingForm.publicBathroomFacilities || []
                );
            });
        }
    }, [
        kmListingForm.facilities,
        kmListingForm.publicParkingFacilities,
        kmListingForm.publicKitchenFacilities,
        kmListingForm.publicBathroomFacilities,
        isEditingKostManager
    ]);


    // Auto-correct default location coordinates based on text address
    useEffect(() => {
        if (!isEditingKostManager) return;
        const reqId = isEditingKostManager.id;
        if (hasAutoGeocodedRef.current[reqId]) return;
        
        const loc = kmListingForm.location;
        const addr = kmListingForm.address;
        
        if (loc && Math.abs(loc.lat - (-5.147665)) < 0.0001 && Math.abs(loc.lng - 119.432731) < 0.0001 && addr && addr.length > 5) {
            hasAutoGeocodedRef.current[reqId] = true;
            
            const parts = addr.split(',');
            const query1 = parts.slice(0, Math.min(parts.length, 3)).join(', ');
            
            console.log("Auto-correcting default coordinates using Google Geocoder. Query:", query1);
            const gw = (window as any).google;
            if (!gw?.maps?.Geocoder) return;
            const geocoder = new gw.maps.Geocoder();
            geocoder.geocode(
                { address: query1, componentRestrictions: { country: 'ID' } },
                (results: any[], status: string) => {
                    if (status === 'OK' && results && results.length > 0) {
                        const loc2 = results[0].geometry.location;
                        const newLoc = { lat: loc2.lat(), lng: loc2.lng() };
                        console.log("Auto-corrected default location coordinates to:", newLoc);
                        setKmListingForm(prev => ({ ...prev, location: newLoc }));
                    } else {
                        // Fallback: Street + City
                        const query2 = parts[0] + ", Makassar, Indonesia";
                        console.log("Query 1 failed. Try fallback:", query2);
                        geocoder.geocode(
                            { address: query2 },
                            (results2: any[], status2: string) => {
                                if (status2 === 'OK' && results2 && results2.length > 0) {
                                    const loc3 = results2[0].geometry.location;
                                    const newLoc2 = { lat: loc3.lat(), lng: loc3.lng() };
                                    console.log("Auto-corrected via fallback to:", newLoc2);
                                    setKmListingForm(prev => ({ ...prev, location: newLoc2 }));
                                }
                            }
                        );
                    }
                }
            );
        }
    }, [isEditingKostManager, kmListingForm.location, kmListingForm.address]);

    const kmMapRef = useRef<HTMLDivElement>(null);
    const kmMapInstance = useRef<any>(null);
    const kmMarkerInstance = useRef<any>(null);
    const kmOriginalLocationRef = useRef<any>(null);

    // Fullscreen Pop-up Map Picker & Confirmation Modal States & Refs
    const [isMapModalOpen, setIsMapModalOpen] = useState(false);
    const [pendingLocationChange, setPendingLocationChange] = useState<{ lat: number; lng: number } | null>(null);
    const [modalTempLocation, setModalTempLocation] = useState<{ lat: number; lng: number }>({ lat: -5.147665, lng: 119.432731 });
    const modalMapRef = useRef<HTMLDivElement>(null);
    const modalMapInstance = useRef<any>(null);
    const modalMarkerInstance = useRef<any>(null);
    const [modalSearchQuery, setModalSearchQuery] = useState('');
    const [modalSearchResults, setModalSearchResults] = useState<any[]>([]);
    const [isSearchingModalMap, setIsSearchingModalMap] = useState(false);
    const modalSearchDebounceRef = useRef<NodeJS.Timeout | null>(null);

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

        const startLat = modalTempLocation.lat || -5.147665;
        const startLng = modalTempLocation.lng || 119.432731;

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

        // Trigger deteksi master data & scan mikro instan
        if (lat && lng) {
            detectNearbyLandmarks(lat, lng);
        }

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


    const closeKostManagerListing = () => {
        setIsEditingKostManager(null);
        setMitraProfile(null);
        setSignatureData(null);
        setAgreedToTerms(false);
        setExpandedRoomIdx(null);
        setActivePhotoIdx(0);
        setKmListingForm({
            title: '',
            description: '',
            address: '',
            city: 'Makassar',
            area: '',
            type: 'Campur',
            price: 0,
            owner_uid: '',
            roomTypes: [],
            publicBathroomFacilities: [],
            publicKitchenFacilities: [],
            publicParkingFacilities: ['Parkir Motor'],
            facilities: ['WiFi', 'Area Parkir'],
            location: { lat: -5.147665, lng: 119.432731 },
            rules: ['Tidak boleh membawa hewan peliharaan', 'Tamu dilarang menginap'],
            image_urls: [],
            campuses: []
        });
        setKmStep(1);
        setTemporaryRoom(null);
        setActiveRoomIdx(null);
        setPhotoCategories(['Bangunan Depan', 'Koridor', 'Area Parkir', 'Lingkungan']);
        const cleanupParams = new URLSearchParams(searchParams);
        cleanupParams.delete('onboarding_id');
        setSearchParams(cleanupParams);
        setIsExistingPropertyMigration(false);
        setWarningAccepted(false);
    };

    const resolveValidOwnerUid = (
        formOwnerUid?: string,
        req?: SurveyRequest | null,
        profile?: any,
        existingOwnerUid?: string
    ): string => {
        const uuidPat = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        // 1. Prioritas Tertinggi: Owner UID asli dari database properti yang sudah ada (bukan ID agen)
        if (existingOwnerUid && uuidPat.test(existingOwnerUid) && existingOwnerUid !== user?.id && existingOwnerUid !== uid) {
            return existingOwnerUid;
        }
        // 2. Request user_id (Mitra pemohon KostManager / survei)
        if (req?.user_id && uuidPat.test(req.user_id) && req.user_id !== user?.id && req.user_id !== uid) {
            return req.user_id;
        }
        if (req?.user_id && uuidPat.test(req.user_id)) return req.user_id;
        if (profile?.id && uuidPat.test(profile.id) && profile.id !== user?.id && profile.id !== uid) {
            return profile.id;
        }
        if (profile?.id && uuidPat.test(profile.id)) return profile.id;
        if (req?.user?.id && uuidPat.test(req.user.id) && req.user.id !== user?.id && req.user.id !== uid) {
            return req.user.id;
        }
        if (req?.user?.id && uuidPat.test(req.user.id)) return req.user.id;
        // 3. Form owner UID jika bukan ID agen
        if (formOwnerUid && uuidPat.test(formOwnerUid) && formOwnerUid !== user?.id && formOwnerUid !== uid) {
            return formOwnerUid;
        }
        // 4. Fallback existingOwnerUid jika ada
        if (existingOwnerUid && uuidPat.test(existingOwnerUid)) {
            return existingOwnerUid;
        }
        // 5. Fallback formOwnerUid jika ada
        if (formOwnerUid && uuidPat.test(formOwnerUid)) return formOwnerUid;
        return '00000000-0000-0000-0000-000000000000';
    };

    const handleSaveDraftDirectly = async (currentForm: any, silent = true) => {
        if (!isEditingKostManager) return;
        try {
            const finalPrice = currentForm.roomTypes.length > 0 
                ? Math.min(...currentForm.roomTypes.map((rt: any) => Number(rt.price)).filter((p: number) => p > 0))
                : 0;

            // Find propertyId from memory or metadata
            let propertyIdToFetch = null;
            const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (isEditingKostManager.kost_id && uuidPattern.test(isEditingKostManager.kost_id)) {
                propertyIdToFetch = isEditingKostManager.kost_id;
            } else if (isEditingKostManager.transaction_id) {
                const { data: trxData } = await supabase
                    .from('transactions')
                    .select('metadata')
                    .eq('id', isEditingKostManager.transaction_id)
                    .maybeSingle();
                const rawSavePropId = trxData?.metadata?.propertyId;
                if (rawSavePropId && uuidPattern.test(rawSavePropId)) {
                    propertyIdToFetch = rawSavePropId;
                }
            }

            // Fetch existing property for this user to edit
            let query = supabase.from('properties').select('id, is_managed, owner_uid, mitra_id');
            let canQuerySaveProperties = false;
            if (propertyIdToFetch) {
                query = query.eq('id', propertyIdToFetch);
                canQuerySaveProperties = true;
            } else if (isEditingKostManager.user_id && uuidPattern.test(isEditingKostManager.user_id)) {
                query = query.eq('owner_uid', isEditingKostManager.user_id);
                canQuerySaveProperties = true;
            }
            
            const { data: existingProps } = canQuerySaveProperties
                ? await query
                : { data: null };

            const existingProp = existingProps?.find(p => p.is_managed) || existingProps?.[0];

            const validOwnerUid = resolveValidOwnerUid(
                currentForm.owner_uid, 
                isEditingKostManager, 
                mitraProfile, 
                existingProp?.owner_uid || existingProp?.mitra_id
            );

            // Urutkan tipe kamar berdasarkan harga bulanan tertinggi (paling mahal)
            const getRoomPrice = (r: any) => {
                if (Array.isArray(r.pricing) && r.pricing.length > 0) {
                    const bulanan = r.pricing.find((p: any) => p.period === 'bulanan');
                    if (bulanan && Number(bulanan.price) > 0) return Number(bulanan.price);
                    const maxP = Math.max(...r.pricing.map((p: any) => Number(p.price || 0)));
                    if (maxP > 0) return maxP;
                }
                return Number(r.price || 0);
            };

            const sortedRooms = [...(currentForm.roomTypes || [])].sort((a, b) => getRoomPrice(b) - getRoomPrice(a));
            const roomPhotosList: any[] = [];
            sortedRooms.forEach((rm: any) => {
                const rmImgs = Array.isArray(rm.images) ? rm.images : [];
                rmImgs.forEach((img: any, i: number) => {
                    const urlStr = getImageUrlString(img);
                    if (!urlStr) return;
                    const cat = (rm.photoCategories && rm.photoCategories[i]) || `Kamar: ${rm.name || 'Unit'}`;
                    roomPhotosList.push({
                        original: urlStr,
                        url: urlStr,
                        label: cat.startsWith('Kamar:') ? cat : `Kamar: ${rm.name || 'Unit'} - ${cat}`
                    });
                });
            });

            const publicPhotosList = (currentForm.image_urls || []).map((img: any, idx: number) => {
                const url = getImageUrlString(img);
                if (!url) return null;
                const label = photoCategories[idx] || (typeof img === 'object' && img.label) || 'Foto Lainnya';
                return { original: url, url: url, label: label };
            }).filter(Boolean);

            const propertyPayload = {
                title: currentForm.title,
                description: currentForm.description,
                address: currentForm.address,
                city: currentForm.city,
                area: currentForm.area,
                type: currentForm.type,
                price: finalPrice,
                owner_uid: validOwnerUid,
                mitra_id: validOwnerUid, // Add valid mitra_id for not-null DB constraint
                room_types: currentForm.roomTypes,
                status: (agreedToTerms || signatureData) ? 'published' : 'draft',
                is_managed: true,
                facilities: currentForm.facilities,
                location: currentForm.location,
                rules: currentForm.rules,
                image_urls: roomPhotosList.length > 0 ? [...roomPhotosList, ...publicPhotosList] : publicPhotosList,
                campuses: currentForm.campuses,
                metadata: {
                    province: currentForm.province || '',
                    publicParkingFacilities: currentForm.publicParkingFacilities || kmListingForm.publicParkingFacilities || ['Parkir Motor'],
                    publicKitchenFacilities: currentForm.publicKitchenFacilities || kmListingForm.publicKitchenFacilities || [],
                    publicBathroomFacilities: currentForm.publicBathroomFacilities || kmListingForm.publicBathroomFacilities || [],
                    addressNotes: currentForm.addressNotes || kmListingForm.addressNotes || '',
                    signature_data: signatureData || null,
                    agreed_to_terms: agreedToTerms
                }
            };

            let savedProperty = null;
            if (existingProp) {
                const { data, error } = await supabase.from('properties').update(propertyPayload).eq('id', existingProp.id).select().maybeSingle();
                if (error) throw error;
                savedProperty = data;
            } else {
                const { data, error } = await supabase.from('properties').insert([propertyPayload]).select().maybeSingle();
                if (error) throw error;
                savedProperty = data;
            }

            if (savedProperty) {
                const kmPropertyPayload = {
                    property_id: savedProperty.id,
                    owner_uid: isEditingKostManager.user_id,
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

                const { data: existingKmProp } = await supabase
                    .from('mitra_kostmanager')
                    .select('id')
                    .eq('property_id', savedProperty.id)
                    .maybeSingle();

                if (existingKmProp) {
                    const { error: kmErr } = await supabase
                        .from('mitra_kostmanager')
                        .update(kmPropertyPayload)
                        .eq('id', existingKmProp.id);
                    if (kmErr) throw kmErr;
                } else {
                    const { error: kmErr } = await supabase
                        .from('mitra_kostmanager')
                        .insert([kmPropertyPayload]);
                    if (kmErr) throw kmErr;
                }

                if (!isEditingKostManager.kost_id) {
                    setIsEditingKostManager((prev: any) => prev ? { ...prev, kost_id: savedProperty.id } : null);
                }

                if (!silent) {
                    alert('Draf onboarding berhasil disimpan langsung ke database!');
                }
            }
        } catch (err: any) {
            console.error("Gagal menyimpan draf ke database:", err);
            if (!silent) {
                alert('Gagal menyimpan draf ke database: ' + err.message);
            }
        }
    };

    const saveKostManagerDraftToDatabase = async (currentForm: any, stepNum?: number, cats?: string[]) => {
        if (!isEditingKostManager) return;
        try {
            const draftData = {
                kmListingForm: currentForm,
                kmStep: stepNum !== undefined ? stepNum : kmStep,
                temporaryRoom,
                activeRoomIdx,
                kmActiveTab,
                photoCategories: cats || photoCategories,
                isExistingPropertyMigration,
                warningAccepted,
                signatureData,
                agreedToTerms,
                lastUpdated: new Date().toISOString()
            };

            // 1. Simpan segera ke localStorage sebagai cache lokal responsif
            const draftKey = `km_draft_${isEditingKostManager.id}`;
            try {
                localStorage.setItem(draftKey, JSON.stringify(draftData));
            } catch (e) {
                console.warn("LocalStorage set error:", e);
            }

            // 2. Simpan langsung ke Cloud Database (survey_requests.evaluation_summary.draft_data)
            const currentEvalSummary = isEditingKostManager.evaluation_summary || {};
            const updatedEvalSummary = {
                ...(typeof currentEvalSummary === 'object' ? currentEvalSummary : {}),
                draft_data: draftData,
                last_draft_updated_at: new Date().toISOString()
            };

            await supabase
                .from('survey_requests')
                .update({ 
                    evaluation_summary: updatedEvalSummary,
                    updated_at: new Date().toISOString()
                })
                .eq('id', isEditingKostManager.id);

            // Update state in-memory agar selalu sinkron
            setIsEditingKostManager((prev: any) => prev ? { ...prev, evaluation_summary: updatedEvalSummary } : null);
            console.log("Draft successfully auto-saved directly to Supabase Cloud Database for survey request:", isEditingKostManager.id);
        } catch (err) {
            console.warn("Silent background draft save warning:", err);
        }
    };

    const closeKostManagerListingWithSave = async () => {
        if (isEditingKostManager && (kmListingForm.title || (kmListingForm.image_urls && kmListingForm.image_urls.length > 0))) {
            await saveKostManagerDraftToDatabase(kmListingForm, kmStep, photoCategories);
            await handleSaveDraftDirectly(kmListingForm, true);
        }
        closeKostManagerListing();
    };

    // Auto-save Kost Manager Onboarding draft effect (Debounced to database & instant to localStorage)
    useEffect(() => {
        if (isEditingKostManager && (kmListingForm.title || (kmListingForm.image_urls && kmListingForm.image_urls.length > 0) || (kmListingForm.facilities && kmListingForm.facilities.length > 0))) {
            const draftKey = `km_draft_${isEditingKostManager.id}`;
            const draftData = {
                kmListingForm,
                kmStep,
                temporaryRoom,
                activeRoomIdx,
                kmActiveTab,
                photoCategories,
                isExistingPropertyMigration,
                warningAccepted,
                signatureData,
                agreedToTerms,
                lastUpdated: new Date().toISOString()
            };
            try {
                localStorage.setItem(draftKey, JSON.stringify(draftData));
            } catch (e) {
                console.warn("LocalStorage set error:", e);
            }

            const timer = setTimeout(() => {
                saveKostManagerDraftToDatabase(kmListingForm, kmStep, photoCategories);
            }, 1200);

            return () => clearTimeout(timer);
        }
    }, [isEditingKostManager?.id, kmListingForm, kmStep, temporaryRoom, activeRoomIdx, kmActiveTab, photoCategories, signatureData, agreedToTerms]);

    // Auto-load onboarding from URL search params on refresh
    useEffect(() => {
        const onboardingIdStr = searchParams.get('onboarding_id');
        if (onboardingIdStr && surveyRequests && surveyRequests.length > 0 && !isEditingKostManager) {
            const reqId = parseInt(onboardingIdStr, 10);
            const found = surveyRequests.find(r => r.id === reqId);
            if (found) {
                openKostManagerListing(found);
            }
        }
    }, [searchParams, surveyRequests, isEditingKostManager]);


    // Initializer for landmark map picker (Google Maps)
    useEffect(() => {
        if (!isEditingKostManager || kmStep !== 1 || !kmLandmarkMapRef.current) {
            if (kmLandmarkMapInstance.current) {
                (window as any).google?.maps?.event?.clearInstanceListeners(kmLandmarkMapInstance.current);
                kmLandmarkMapInstance.current = null;
                kmLandmarkMarkerInstance.current = null;
            }
            return;
        }

        if (kmLandmarkMapInstance.current) return;

        const google = (window as any).google;
        if (!google?.maps) return;

        const initialLat = kmListingForm.location?.lat || -5.147665;
        const initialLng = kmListingForm.location?.lng || 119.432731;

        try {
            const map = new google.maps.Map(kmLandmarkMapRef.current, {
                center: { lat: initialLat, lng: initialLng },
                zoom: 15,
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: false,
                zoomControl: true,
                gestureHandling: 'greedy',
            });

            const marker = new google.maps.Marker({
                position: { lat: initialLat, lng: initialLng },
                map,
                draggable: false,
            });

            map.addListener('click', (e: any) => {
                marker.setPosition(e.latLng);
                setLandmarkLocation({ lat: e.latLng.lat(), lng: e.latLng.lng() });
            });

            kmLandmarkMapInstance.current = map;
            kmLandmarkMarkerInstance.current = marker;
        } catch (e) {
            console.error("Google Maps landmark init error:", e);
        }

        return () => {
            if (kmLandmarkMapInstance.current) {
                (window as any).google?.maps?.event?.clearInstanceListeners(kmLandmarkMapInstance.current);
                kmLandmarkMapInstance.current = null;
                kmLandmarkMarkerInstance.current = null;
            }
        };
    }, [isEditingKostManager, kmStep, showAddLandmarkForm, !!kmLandmarkMapRef.current]);

    // Update landmark marker position when state updates
    useEffect(() => {
        if (kmLandmarkMarkerInstance.current && landmarkLocation) {
            kmLandmarkMarkerInstance.current.setPosition({ lat: landmarkLocation.lat, lng: landmarkLocation.lng });
            if (kmLandmarkMapInstance.current) {
                kmLandmarkMapInstance.current.panTo({ lat: landmarkLocation.lat, lng: landmarkLocation.lng });
            }
        }
    }, [landmarkLocation.lat, landmarkLocation.lng]);

    // Sync landmark location with main property location when property coordinates are locked
    useEffect(() => {
        if (kmListingForm.location && kmLandmarkMapInstance.current) {
            kmLandmarkMapInstance.current.setCenter({ lat: kmListingForm.location.lat, lng: kmListingForm.location.lng });
            setLandmarkLocation({ lat: kmListingForm.location.lat, lng: kmListingForm.location.lng });
        }
    }, [kmListingForm.location?.lat, kmListingForm.location?.lng]);

    const confirmLocationChange = () => {
        if (kmOriginalLocationRef.current && kmOriginalLocationRef.current.lat) {
            return window.confirm("Apakah Anda yakin ingin mengubah titik lokasi GPS kost yang sudah terdaftar sebelumnya?");
        }
        return true;
    };

    // Main GPS picker (Google Maps)
    useEffect(() => {
        if (!isEditingKostManager || kmStep !== 1 || !kmMapRef.current) {
            if (kmMapInstance.current) {
                (window as any).google?.maps?.event?.clearInstanceListeners(kmMapInstance.current);
                kmMapInstance.current = null;
                kmMarkerInstance.current = null;
            }
            return;
        }

        if (kmMapInstance.current) return;

        const google = (window as any).google;
        if (!google?.maps) return;

        const initialLat = kmListingForm.location?.lat || -5.147665;
        const initialLng = kmListingForm.location?.lng || 119.432731;

        try {
            const map = new google.maps.Map(kmMapRef.current, {
                center: { lat: initialLat, lng: initialLng },
                zoom: 15,
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: false,
                zoomControl: true,
                gestureHandling: 'greedy',
            });

            const marker = new google.maps.Marker({
                position: { lat: initialLat, lng: initialLng },
                map,
                draggable: true,
            });

            map.addListener('click', (e: any) => {
                const clickLat = e.latLng.lat();
                const clickLng = e.latLng.lng();
                marker.setPosition({ lat: clickLat, lng: clickLng });
                reverseGeocodeAndApply(clickLat, clickLng);
            });

            marker.addListener('dragend', () => {
                const pos = marker.getPosition();
                if (pos) {
                    reverseGeocodeAndApply(pos.lat(), pos.lng());
                }
            });

            kmMapInstance.current = map;
            kmMarkerInstance.current = marker;
        } catch (e) {
            console.error("Google Maps init error:", e);
        }

        return () => {
            if (kmMapInstance.current) {
                (window as any).google?.maps?.event?.clearInstanceListeners(kmMapInstance.current);
                kmMapInstance.current = null;
                kmMarkerInstance.current = null;
            }
        };
    }, [isEditingKostManager, kmStep, !!kmMapRef.current]);

    // Sync marker when form location changes externally
    useEffect(() => {
        if (kmMapInstance.current && kmMarkerInstance.current && kmListingForm.location?.lat) {
            const newLat = kmListingForm.location.lat;
            const newLng = kmListingForm.location.lng;
            kmMarkerInstance.current.setPosition({ lat: newLat, lng: newLng });
            kmMapInstance.current.setCenter({ lat: newLat, lng: newLng });
        }
    }, [kmListingForm.location?.lat, kmListingForm.location?.lng]);

    // Load bank settings from user database profile
    useEffect(() => {
        if (user) {
            if (user.bank_name) setAgentBankName(user.bank_name);
            if (user.bank_account) setAgentBankAccount(user.bank_account);
            if (user.bank_account_name) setAgentAccountName(user.bank_account_name);
            else if (user.displayName || user.name) setAgentAccountName(user.displayName || user.name);
        }
    }, [user]);

    // Load withdrawal history from database
    const loadWalletData = async () => {
        if (!uid) return;
        setIsLoadingWallet(true);
        try {
            const { data, error } = await supabase
                .from('withdrawal_requests')
                .select('*')
                .eq('agent_id', uid)
                .order('created_at', { ascending: false });
            if (error) throw error;
            setWithdrawalHistory(data || []);
        } catch (error) {
            console.error('Error loading withdrawal history:', error);
        } finally {
            setIsLoadingWallet(false);
        }
    };

    useEffect(() => {
        if (activeMenu === 'wallet') {
            loadWalletData();
        }
    }, [activeMenu, uid]);

    const saveBankSettings = async () => {
        if (!agentBankName || !agentBankAccount || !agentAccountName) {
            alert('Mohon lengkapi data rekening.');
            return;
        }
        setIsSubmitting(true);
        try {
            // Update public.user_bank_accounts table in Supabase
            const { error: dbError } = await supabase
                .from('user_bank_accounts')
                .upsert({
                    user_id: uid,
                    bank_name: agentBankName,
                    bank_account: agentBankAccount,
                    bank_account_name: agentAccountName,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id' });
            
            if (dbError) throw dbError;

            // Also update Auth metadata to trigger USER_UPDATED event in App.tsx
            const { error: authError } = await supabase.auth.updateUser({
                data: {
                    bank_name: agentBankName,
                    bank_account: agentBankAccount,
                    bank_account_name: agentAccountName
                }
            });
            if (authError) throw authError;

            alert('Data rekening berhasil disimpan!');
        } catch (error: any) {
            console.error(error);
            alert('Gagal menyimpan data rekening: ' + (error.message || error));
        } finally {
            setIsSubmitting(false);
        }
    };

    // Auto-save draft effect
    useEffect(() => {
        if (isEditingSurvey && surveyForm && Object.keys(surveyForm).length > 0) {
            const draftKey = `survey_draft_${isEditingSurvey.id}`;
            localStorage.setItem(draftKey, JSON.stringify(surveyForm));
        }
    }, [surveyForm, isEditingSurvey]);

    const openSurveyEditor = (req: SurveyRequest, defaultStatus: string) => {
        setIsEditingSurvey(req);
        const defaultForm = {
            status: defaultStatus,
            assigned_agent_id: req.assigned_agent_id,
            agent_name: req.agent_name,
            agent_phone: req.agent_phone,
            result_drive_link: req.result_drive_link,
            evaluation_summary: req.evaluation_summary || {}
        };
        const draftKey = `survey_draft_${req.id}`;
        const savedDraft = localStorage.getItem(draftKey);
        if (savedDraft) {
            try {
                const parsed = JSON.parse(savedDraft);
                setSurveyForm(parsed);
            } catch (e) {
                setSurveyForm(defaultForm);
            }
                } else {
            setSurveyForm(defaultForm);
        }
    };

    const openKostManagerListing = async (req: SurveyRequest) => {
        setIsEditingKostManager(req);
        setAgreedToTerms(false);
        setSignatureData(null);
        setExpandedRoomIdx(null);
        setActivePhotoIdx(0);
        
        // Fetch owner user profile with multi-level fallback (NO dummy data)
        let fetchedUser: any = null;
        try {
            // 1. Fetch by req.user_id if present
            if (req.user_id) {
                const { data: uData } = await supabase.from('users').select('*').eq('id', req.user_id).maybeSingle();
                if (uData) fetchedUser = uData;
            }

            // 2. If no user_id or user not found, try fetching owner via property if req.kost_id is present
            if (!fetchedUser && req.kost_id) {
                const uuidPat = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                if (uuidPat.test(req.kost_id)) {
                    const { data: propData } = await supabase.from('properties').select('user_id, owner_id').eq('id', req.kost_id).maybeSingle();
                    const ownerUid = propData?.user_id || propData?.owner_id;
                    if (ownerUid) {
                        const { data: propUserData } = await supabase.from('users').select('*').eq('id', ownerUid).maybeSingle();
                        if (propUserData) fetchedUser = propUserData;
                    }
                }
            }

            // Resolve name, phone, email across fetchedUser, req.user, req.transaction.metadata, req.owner_phone
            const resolvedName = fetchedUser?.full_name || fetchedUser?.name || req.user?.name || req.user?.full_name || req.transaction?.metadata?.ownerName || req.transaction?.metadata?.userName || '';
            const resolvedPhone = fetchedUser?.phone || req.user?.phone || req.owner_phone || req.transaction?.metadata?.ownerPhone || req.transaction?.metadata?.phone || '';
            const resolvedEmail = fetchedUser?.email || req.user?.email || req.transaction?.metadata?.ownerEmail || req.transaction?.metadata?.userEmail || '';

            setMitraProfile({
                id: fetchedUser?.id || req.user_id || '',
                full_name: resolvedName,
                name: resolvedName,
                phone: resolvedPhone,
                email: resolvedEmail
            });
        } catch (e) {
            console.error("Error fetching user profile:", e);
            const resolvedName = req.user?.name || req.user?.full_name || req.transaction?.metadata?.ownerName || '';
            const resolvedPhone = req.user?.phone || req.owner_phone || req.transaction?.metadata?.ownerPhone || '';
            const resolvedEmail = req.user?.email || req.transaction?.metadata?.ownerEmail || '';
            setMitraProfile({
                full_name: resolvedName,
                name: resolvedName,
                phone: resolvedPhone,
                email: resolvedEmail
            });
        }
        setSearchParams({ status: agentTab, onboarding_id: req.id.toString() });

        const draftKey = `km_draft_${req.id}`;
        
        // 1. Fetch existing Kost Manager property & room types first to assist in sanitizing drafts and prefilling
        let kmRoomTypes: any[] = [];
        let dbPropertyRecord: any = null;
        let dbKmProp: any = null;
        try {
            // Find propertyId from req.kost_id, transaction metadata, or request properties
            let propertyIdToFetch: string | null = null;
            const uuidPatDraft = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            
            if (req.kost_id && uuidPatDraft.test(req.kost_id)) {
                propertyIdToFetch = req.kost_id;
                console.log("openKostManagerListing: resolved propertyIdToFetch from req.kost_id:", propertyIdToFetch);
            } else if (req.transaction?.metadata?.propertyId && uuidPatDraft.test(req.transaction.metadata.propertyId)) {
                propertyIdToFetch = req.transaction.metadata.propertyId;
                console.log("openKostManagerListing: resolved propertyIdToFetch from req.transaction.metadata:", propertyIdToFetch);
            } else if ((req as any).property_id && uuidPatDraft.test((req as any).property_id)) {
                propertyIdToFetch = (req as any).property_id;
            } else if ((req as any).propertyId && uuidPatDraft.test((req as any).propertyId)) {
                propertyIdToFetch = (req as any).propertyId;
            } else if (req.transaction_id) {
                const { data: trxData } = await supabase
                    .from('transactions')
                    .select('metadata')
                    .eq('id', req.transaction_id)
                    .maybeSingle();
                if (trxData?.metadata?.propertyId && uuidPatDraft.test(trxData.metadata.propertyId)) {
                    propertyIdToFetch = trxData.metadata.propertyId;
                    console.log("openKostManagerListing: resolved propertyIdToFetch from transaction metadata query:", propertyIdToFetch);
                }
            }

            let existingProps: any[] | null = null;
            if (propertyIdToFetch) {
                const { data } = await supabase.from('properties').select('*').eq('id', propertyIdToFetch);
                existingProps = data;
            }
            
            // Fallback search by owner_uid or mitra_id if not found or no propertyId
            if ((!existingProps || existingProps.length === 0) && req.user_id && uuidPatDraft.test(req.user_id)) {
                const { data } = await supabase
                    .from('properties')
                    .select('*')
                    .or(`owner_uid.eq.${req.user_id},mitra_id.eq.${req.user_id}`);
                existingProps = data;
            }

            // Find best matching property: by ID, by exact title, by partial title match, or first property
            const matchedProp = existingProps?.find(p => p.id === propertyIdToFetch)
                || existingProps?.find(p => p.title && req.kost_name && p.title.trim().toLowerCase() === req.kost_name.trim().toLowerCase())
                || existingProps?.find(p => p.title && req.kost_name && (p.title.toLowerCase().includes(req.kost_name.toLowerCase()) || req.kost_name.toLowerCase().includes(p.title.toLowerCase())))
                || existingProps?.[0];

            if (matchedProp) {
                dbPropertyRecord = matchedProp;
                console.log("openKostManagerListing: matched existing property record for cloning:", dbPropertyRecord.id, dbPropertyRecord.title);
                const { data: kmProp } = await supabase
                    .from('mitra_kostmanager')
                    .select('*')
                    .eq('property_id', matchedProp.id)
                    .maybeSingle();
                if (kmProp) {
                    dbKmProp = kmProp;
                    if (kmProp.room_types) {
                        kmRoomTypes = kmProp.room_types;
                    }
                }
            }
        } catch (e: any) {
            console.error("Error pre-fetching property data for cloning & draft sanitization:", e);
        }

        // Set migration flag and always show verification warning modal on open
        if (dbPropertyRecord || dbKmProp) {
            setIsExistingPropertyMigration(true);
            setWarningAccepted(false); // ALWAYS show "Peninjauan Ulang Data" warning to surveyor on opening
        } else {
            setIsExistingPropertyMigration(false);
            setWarningAccepted(true);
        }

        // Extract existing signature data from multiple possible sources
        let initialSignature = (req as any).signature_data || 
                               (req as any).evaluation_summary?.signature_data || 
                               dbKmProp?.signature_data || 
                               dbKmProp?.metadata?.signature_data || 
                               dbPropertyRecord?.metadata?.signature_data || 
                               null;

        if (!initialSignature) {
            try {
                const { data: kmSurv } = await supabase
                    .from('kostmanager_surveys')
                    .select('signature_data')
                    .or(`kostmanager_request_id.eq.${req.id},id.eq.${req.id}`)
                    .not('signature_data', 'is', null)
                    .limit(1)
                    .maybeSingle();
                if (kmSurv?.signature_data) {
                    initialSignature = kmSurv.signature_data;
                } else if (req.transaction_id) {
                    const { data: sReq } = await supabase
                        .from('survey_requests')
                        .select('signature_data')
                        .eq('transaction_id', req.transaction_id)
                        .not('signature_data', 'is', null)
                        .limit(1)
                        .maybeSingle();
                    if (sReq?.signature_data) {
                        initialSignature = sReq.signature_data;
                    }
                }
            } catch (sigErr) {
                console.warn("Could not query fallback signature in openKostManagerListing:", sigErr);
            }
        }

        if (initialSignature) {
            setSignatureData(initialSignature);
            setAgreedToTerms(true);
        } else {
            setSignatureData(null);
            setAgreedToTerms(false);
        }

        // Define sets of existing regular Mitra self-listing photos to isolate and prevent cloning into KostManager surveyor form
        // NOTE: Only pure self-listing photos (in metadata.self_listing_images or non-kostmanager photos) are treated as self-listing.
        const selfListingImagesSet = new Set<string>([
            ...(Array.isArray(dbPropertyRecord?.metadata?.self_listing_images) ? dbPropertyRecord.metadata.self_listing_images : []),
            ...(Array.isArray(dbPropertyRecord?.image_urls) ? dbPropertyRecord.image_urls.filter((u: any) => {
                const s = getImageUrlString(u);
                return s && !s.includes('kostmanager/');
            }) : [])
        ].map(getImageUrlString).filter(Boolean));

        const selfRoomImagesSet = new Set<string>();
        (dbPropertyRecord?.metadata?.self_listing_room_types || []).forEach((r: any) => {
            (r.images || []).forEach((img: any) => {
                const u = getImageUrlString(img);
                if (u && !u.includes('kostmanager/')) selfRoomImagesSet.add(u);
            });
        });
        (dbPropertyRecord?.room_types || []).forEach((r: any) => {
            (r.images || []).forEach((img: any) => {
                const u = getImageUrlString(img);
                if (u && !u.includes('kostmanager/')) selfRoomImagesSet.add(u);
            });
        });

        const isValidSurveyPhoto = (urlOrObj: any): boolean => {
            const urlStr = getImageUrlString(urlOrObj);
            if (!urlStr) return false;
            // Any photo uploaded in kostmanager survey or blob/data is ALWAYS valid
            if (urlStr.includes('kostmanager/') || urlStr.startsWith('blob:') || urlStr.startsWith('data:')) {
                return true;
            }
            if (selfListingImagesSet.has(urlStr) || selfRoomImagesSet.has(urlStr)) return false;
            return true;
        };

        // 2. Load draft from Cloud Database first, fallback to localStorage
        let savedDraftData: any = (req as any).evaluation_summary?.draft_data || (req as any).draft_data || null;

        if (!savedDraftData) {
            try {
                const { data: sReqDraft } = await supabase
                    .from('survey_requests')
                    .select('evaluation_summary')
                    .eq('id', req.id)
                    .maybeSingle();
                if (sReqDraft?.evaluation_summary?.draft_data) {
                    savedDraftData = sReqDraft.evaluation_summary.draft_data;
                }
            } catch (e) {
                console.warn("Could not query DB draft from survey_requests:", e);
            }
        }

        if (!savedDraftData) {
            const savedDraft = localStorage.getItem(draftKey);
            if (savedDraft) {
                try {
                    savedDraftData = JSON.parse(savedDraft);
                } catch (e) {
                    console.error("Failed to parse saved localStorage draft:", e);
                }
            }
        }

        if (savedDraftData) {
            try {
                const parsed = savedDraftData;
                if (parsed.signatureData) {
                    setSignatureData(parsed.signatureData);
                    setAgreedToTerms(true);
                } else if (parsed.agreedToTerms !== undefined) {
                    setAgreedToTerms(parsed.agreedToTerms);
                }
                if (parsed.kmListingForm) {
                    // Sanitize draft room types: keep valid survey photos
                    let draftRoomTypes = (parsed.kmListingForm.roomTypes || []).map((rt: any) => ({
                        ...rt,
                        images: (rt.images || []).filter(isValidSurveyPhoto),
                        photoCategories: rt.photoCategories || [],
                        categorized_photos: rt.categorized_photos || {},
                        categorizedPhotos: rt.categorizedPhotos || rt.categorized_photos || {}
                    }));

                    // Fallback room definitions to database if draft has none (while keeping photos clean)
                    if (draftRoomTypes.length === 0) {
                        const sourceRooms = dbKmProp?.room_types || dbPropertyRecord?.room_types || [];
                        draftRoomTypes = sourceRooms.map((rm: any) => ({
                            ...rm,
                            images: (rm.images || []).filter(isValidSurveyPhoto),
                            photoCategories: [],
                            categorized_photos: {},
                            categorizedPhotos: {}
                        }));
                    }
                    parsed.kmListingForm.roomTypes = draftRoomTypes;

                    // Fallback campuses to database if draft has none (helps heal corrupted drafts or empty states)
                    let draftCampuses = parsed.kmListingForm.campuses || [];
                    if (draftCampuses.length === 0) {
                        const dbCampuses = dbKmProp?.campuses || dbPropertyRecord?.campuses || [];
                        if (dbCampuses.length > 0) {
                            draftCampuses = dbCampuses;
                        }
                    }

                    // Sanitize draft public area images
                    const rawDraftImages = Array.isArray(parsed.kmListingForm.image_urls) ? parsed.kmListingForm.image_urls : [];
                    const draftImageUrls: string[] = [];
                    const draftPhotoCats: string[] = [];
                    rawDraftImages.forEach((img: any, idx: number) => {
                        const urlStr = getImageUrlString(img);
                        if (!urlStr || !isValidSurveyPhoto(urlStr)) return;
                        
                        let cat = (typeof img === 'object' && img.label) 
                            ? img.label 
                            : (parsed.kmListingForm.photoCategories?.[idx] || parsed.photoCategories?.[idx] || (idx < 4 ? ['Bangunan Depan', 'Koridor', 'Area Parkir', 'Lingkungan'][idx] : `Foto Lainnya ${idx - 3}`));
                        if (cat.toLowerCase() === 'area umum' || cat.toLowerCase() === 'parkiran') cat = 'Area Parkir';
                        draftImageUrls.push(urlStr);
                        draftPhotoCats.push(cat);
                    });
                    parsed.kmListingForm.image_urls = draftImageUrls;
                    parsed.kmListingForm.photoCategories = draftPhotoCats;

                    // Fallback and normalize facilities from database if draft facilities are empty or missing
                    const sourceFacs = (parsed.kmListingForm.facilities && parsed.kmListingForm.facilities.length > 2)
                        ? parsed.kmListingForm.facilities
                        : (dbKmProp?.facilities || dbPropertyRecord?.facilities || parsed.kmListingForm.facilities || ['WiFi', 'Area Parkir', 'Dapur Bersama']);

                    const sourceKitchen = (parsed.kmListingForm.publicKitchenFacilities && parsed.kmListingForm.publicKitchenFacilities.length > 0)
                        ? parsed.kmListingForm.publicKitchenFacilities
                        : (dbKmProp?.metadata?.publicKitchenFacilities || dbPropertyRecord?.metadata?.publicKitchenFacilities || []);

                    const sourceParking = (parsed.kmListingForm.publicParkingFacilities && parsed.kmListingForm.publicParkingFacilities.length > 0)
                        ? parsed.kmListingForm.publicParkingFacilities
                        : (dbKmProp?.metadata?.publicParkingFacilities || dbPropertyRecord?.metadata?.publicParkingFacilities || ['Parkir Motor']);

                    const sourceBathroom = (parsed.kmListingForm.publicBathroomFacilities && parsed.kmListingForm.publicBathroomFacilities.length > 0)
                        ? parsed.kmListingForm.publicBathroomFacilities
                        : (dbKmProp?.metadata?.publicBathroomFacilities || dbPropertyRecord?.metadata?.publicBathroomFacilities || []);

                    const resolvedInitialOwnerUid = resolveValidOwnerUid(parsed.kmListingForm.owner_uid || req.user_id, req, fetchedUser, dbPropertyRecord?.owner_uid);
                    const normalizedDraftFacs = normalizeAndExtractPublicFacilities(
                        sourceFacs,
                        sourceKitchen,
                        sourceParking,
                        sourceBathroom
                    );

                    const mergedForm = {
                        ...parsed.kmListingForm,
                        image_urls: draftImageUrls,
                        photoCategories: draftPhotoCats,
                        roomTypes: draftRoomTypes,
                        campuses: draftCampuses,
                        title: parsed.kmListingForm.title || dbKmProp?.title || dbPropertyRecord?.title || req.kost_name,
                        description: parsed.kmListingForm.description || dbKmProp?.description || dbPropertyRecord?.description || '',
                        address: parsed.kmListingForm.address || dbKmProp?.address || dbPropertyRecord?.address || req.kost_address,
                        province: parsed.kmListingForm.province || dbKmProp?.province || dbPropertyRecord?.province || detectProvinceFromAddress(parsed.kmListingForm.address || req.kost_address),
                        city: parsed.kmListingForm.city || dbKmProp?.city || dbPropertyRecord?.city || 'Makassar',
                        area: parsed.kmListingForm.area || dbKmProp?.area || dbPropertyRecord?.area || '',
                        type: parsed.kmListingForm.type || dbKmProp?.type || dbPropertyRecord?.type || 'Campur',
                        price: parsed.kmListingForm.price || dbKmProp?.price || dbPropertyRecord?.price || 0,
                        totalRooms: parsed.kmListingForm.totalRooms || dbKmProp?.total_rooms || dbPropertyRecord?.total_rooms || (initialTotalRooms || 0),
                        owner_uid: resolvedInitialOwnerUid,
                        facilities: normalizedDraftFacs.facilities,
                        publicKitchenFacilities: normalizedDraftFacs.publicKitchenFacilities,
                        publicParkingFacilities: normalizedDraftFacs.publicParkingFacilities,
                        publicBathroomFacilities: normalizedDraftFacs.publicBathroomFacilities,
                        location: parsed.kmListingForm.location || dbKmProp?.location || dbPropertyRecord?.location || initialCoords,
                        rules: parsed.kmListingForm.rules || dbKmProp?.rules || dbPropertyRecord?.rules || ['Tidak boleh membawa hewan peliharaan', 'Tamu dilarang menginap']
                    };
                    setKmListingForm(mergedForm);
                    setKmStep(parsed.kmStep || 1);
                    setTemporaryRoom(parsed.temporaryRoom || null);
                    setActiveRoomIdx(parsed.activeRoomIdx !== undefined ? parsed.activeRoomIdx : null);
                    setKmActiveTab(parsed.kmActiveTab || 'info');
                    const dynamicDraftCats = computeDynamicPublicPhotoCategories(
                        mergedForm.facilities || ['WiFi', 'Area Parkir'],
                        draftPhotoCats,
                        mergedForm.publicParkingFacilities || [],
                        mergedForm.publicKitchenFacilities || [],
                        mergedForm.publicBathroomFacilities || []
                    );
                    setPhotoCategories(dynamicDraftCats);
                    if (dbPropertyRecord || dbKmProp) {
                        setIsExistingPropertyMigration(true);
                        setWarningAccepted(false); // ALWAYS prompt surveyor with warning modal on open
                    }
                    console.log("Loaded sanitized onboarding draft from Cloud Database / LocalStorage on open");
                    return;
                }
            } catch (e) {
                console.error("Failed to parse saved draft:", e);
            }
        }

        // 3. Populate default form values using the already fetched database records if no draft exists
        let initialTotalRooms = 0;
        let initialCoords = { lat: -5.147665, lng: 119.432731 };
        setKmActiveTab('info');
        setKmStep(1);

        const resolvedOwnerUid = resolveValidOwnerUid(req.user_id, req, fetchedUser);

        try {
            // Find transaction metadata from the request object directly
            const transactionMetadata = req.transaction?.metadata || {};

            // Calculate Mitra's initial input for total rooms and coordinates from transaction metadata or notes
            const parsedMetaRooms = transactionMetadata.total_rooms || transactionMetadata.totalRooms || transactionMetadata.jumlah_kamar || (req as any).total_rooms || (req as any).totalRooms;
            if (parsedMetaRooms) {
                initialTotalRooms = Number(parsedMetaRooms) || 0;
            }
            if (!initialTotalRooms && req.notes) {
                const m = req.notes.match(/(?:total|jumlah)?\s*kamar\s*:\s*(\d+)/i);
                if (m) {
                    initialTotalRooms = Number(m[1]) || 0;
                }
            }

            // Extract coordinates
            const possibleLocationUrls = [
                transactionMetadata.googleMapsLink,
                transactionMetadata.google_maps_url,
                req.kost_name,
                req.notes
            ];
            for (const url of possibleLocationUrls) {
                if (url) {
                    const parsed = extractCoordinates(url);
                    if (parsed) {
                        initialCoords = parsed;
                        break;
                    }
                }
            }
            if (initialCoords.lat === -5.147665 && initialCoords.lng === 119.432731) {
                const directLat = transactionMetadata.location?.lat || transactionMetadata.latitude || (req as any).latitude;
                const directLng = transactionMetadata.location?.lng || transactionMetadata.longitude || (req as any).longitude;
                if (directLat && directLng) {
                    initialCoords = { lat: Number(directLat), lng: Number(directLng) };
                }
            }

            // A. Try loading from dedicated `mitra_kostmanager` table record if exists
            if (dbKmProp) {
                setIsExistingPropertyMigration(true);
                setWarningAccepted(false);
                console.log("openKostManagerListing: loading from dedicated dbKmProp:", dbKmProp.property_id);
                kmOriginalLocationRef.current = dbKmProp.location || null;
                
                const rawKmImages = Array.isArray(dbKmProp.image_urls) ? dbKmProp.image_urls : [];
                const loadedKmImageUrls: string[] = [];
                const loadedKmPhotoCategories: string[] = [];

                rawKmImages.forEach((img: any, idx: number) => {
                    const urlStr = getImageUrlString(img);
                    if (!urlStr || !isValidSurveyPhoto(urlStr)) return;
                    let label = (typeof img === 'object' && img.label) ? img.label : '';
                    if (label.toLowerCase() === 'area umum' || label.toLowerCase() === 'parkiran') label = 'Area Parkir';
                    if (!label) {
                        label = (idx < 4 ? ['Bangunan Depan', 'Koridor', 'Area Parkir', 'Lingkungan'][idx] : `Foto Lainnya ${idx - 3}`);
                    }
                    loadedKmImageUrls.push(urlStr);
                    loadedKmPhotoCategories.push(label);
                });

                const cleanKmRoomTypes = (dbKmProp.room_types || []).map((rm: any) => ({
                    ...rm,
                    images: (rm.images || []).filter(isValidSurveyPhoto),
                    photoCategories: [],
                    categorized_photos: {},
                    categorizedPhotos: {}
                }));

                const normalizedKmFacs = normalizeAndExtractPublicFacilities(
                    dbKmProp.facilities || ['WiFi', 'Area Parkir'],
                    dbKmProp.metadata?.publicKitchenFacilities || [],
                    dbKmProp.metadata?.publicParkingFacilities || [],
                    dbKmProp.metadata?.publicBathroomFacilities || []
                );

                const dynamicKmCats = computeDynamicPublicPhotoCategories(
                    normalizedKmFacs.facilities || ['WiFi', 'Area Parkir'],
                    loadedKmPhotoCategories,
                    normalizedKmFacs.publicParkingFacilities || [],
                    normalizedKmFacs.publicKitchenFacilities || [],
                    normalizedKmFacs.publicBathroomFacilities || []
                );
                setPhotoCategories(dynamicKmCats);
                setShowAddLandmarkForm(false);
                setActiveRoomIdx(null);
                setTemporaryRoom(null);

                let rawKmCity = dbKmProp.city || 'Makassar';
                let rawKmArea = dbKmProp.area || '';
                let rawKmProvince = dbKmProp.province || dbKmProp.metadata?.province || detectProvinceFromAddress(dbKmProp.address || req.kost_address);
                if (rawKmCity.toLowerCase().startsWith('kecamatan') || rawKmCity.toLowerCase().startsWith('kec.')) {
                    if (!rawKmArea) rawKmArea = rawKmCity.replace(/^(Kecamatan|Kec\.)\s+/i, '').trim();
                    rawKmCity = 'Makassar';
                }
                setKmListingForm({
                    title: dbKmProp.title || req.kost_name,
                    description: dbKmProp.description || '',
                    address: dbKmProp.address || req.kost_address,
                    province: rawKmProvince,
                    city: rawKmCity,
                    area: rawKmArea,
                    type: dbKmProp.type || 'Campur',
                    price: dbKmProp.price || 0,
                    totalRooms: (dbKmProp.total_rooms && dbKmProp.total_rooms > 0) ? dbKmProp.total_rooms : (initialTotalRooms || 0),
                    owner_uid: resolvedOwnerUid,
                    roomTypes: cleanKmRoomTypes,
                    facilities: normalizedKmFacs.facilities,
                    location: dbKmProp.location || initialCoords,
                    rules: dbKmProp.rules || ['Tidak boleh membawa hewan peliharaan', 'Tamu dilarang menginap'],
                    image_urls: loadedKmImageUrls,
                    photoCategories: loadedKmPhotoCategories,
                    campuses: dbKmProp.campuses || [],
                    publicBathroomFacilities: normalizedKmFacs.publicBathroomFacilities,
                    publicKitchenFacilities: normalizedKmFacs.publicKitchenFacilities,
                    publicParkingFacilities: normalizedKmFacs.publicParkingFacilities
                });
                return;
            }

            // B. Fallback to `properties` table record if exists (Self-Listing Migration)
            if (dbPropertyRecord) {
                setIsExistingPropertyMigration(true);
                setWarningAccepted(false);
                console.log("openKostManagerListing: fallback to loading from dbPropertyRecord (preserving original photos as self-listing only):", dbPropertyRecord.id);
                kmOriginalLocationRef.current = dbPropertyRecord.location || null;
                
                const normalizedPropFacs = normalizeAndExtractPublicFacilities(
                    dbPropertyRecord.facilities || ['WiFi', 'Area Parkir'],
                    dbPropertyRecord.metadata?.publicKitchenFacilities || [],
                    dbPropertyRecord.metadata?.publicParkingFacilities || [],
                    dbPropertyRecord.metadata?.publicBathroomFacilities || []
                );

                // FRESH SLATE FOR PHOTOS: Do NOT copy self-listing photos into surveyor's form!
                // The surveyor MUST take brand new, authentic on-site survey photos.
                const freshDynamicCats = computeDynamicPublicPhotoCategories(
                    normalizedPropFacs.facilities || ['WiFi', 'Area Parkir'],
                    [],
                    normalizedPropFacs.publicParkingFacilities || [],
                    normalizedPropFacs.publicKitchenFacilities || [],
                    normalizedPropFacs.publicBathroomFacilities || []
                );
                setPhotoCategories(freshDynamicCats);
                setShowAddLandmarkForm(false);
                setActiveRoomIdx(null);
                setTemporaryRoom(null);

                let rawPropCity = dbPropertyRecord.city || 'Makassar';
                let rawPropArea = dbPropertyRecord.area || '';
                let rawPropProvince = dbPropertyRecord.province || dbPropertyRecord.metadata?.province || detectProvinceFromAddress(dbPropertyRecord.address || req.kost_address);
                if (rawPropCity.toLowerCase().startsWith('kecamatan') || rawPropCity.toLowerCase().startsWith('kec.')) {
                    if (!rawPropArea) rawPropArea = rawPropCity.replace(/^(Kecamatan|Kec\.)\s+/i, '').trim();
                    rawPropCity = 'Makassar';
                }

                // If room types exist in self-listing property, keep textual specs (names, pricing, facilities) but clean room photos
                const cleanRoomTypes = (dbPropertyRecord.room_types || []).map((rm: any) => ({
                    ...rm,
                    images: [],
                    photoCategories: [],
                    categorized_photos: {},
                    categorizedPhotos: {}
                }));

                setKmListingForm({
                    title: dbPropertyRecord.title || req.kost_name,
                    description: dbPropertyRecord.description || '',
                    address: dbPropertyRecord.address || req.kost_address,
                    province: rawPropProvince,
                    city: rawPropCity,
                    area: rawPropArea,
                    type: dbPropertyRecord.type || 'Campur',
                    price: dbPropertyRecord.price || 0,
                    totalRooms: (dbPropertyRecord.total_rooms && dbPropertyRecord.total_rooms > 0) ? dbPropertyRecord.total_rooms : (initialTotalRooms || 0),
                    owner_uid: resolvedOwnerUid,
                    roomTypes: cleanRoomTypes,
                    facilities: normalizedPropFacs.facilities,
                    location: dbPropertyRecord.location || initialCoords,
                    rules: dbPropertyRecord.rules || ['Tidak boleh membawa hewan peliharaan', 'Tamu dilarang menginap'],
                    image_urls: [], // FRESH SLATE: Surveyor will take new survey photos (0 Foto)
                    photoCategories: freshDynamicCats,
                    campuses: dbPropertyRecord.campuses || [],
                    publicBathroomFacilities: normalizedPropFacs.publicBathroomFacilities,
                    publicKitchenFacilities: normalizedPropFacs.publicKitchenFacilities,
                    publicParkingFacilities: normalizedPropFacs.publicParkingFacilities
                });
                return;
            }
        } catch (err) {
            console.error("Failed to populate existing property details:", err);
        }

        // C. Clean slate fallback if no property records found in database
        kmOriginalLocationRef.current = null;
        setPhotoCategories(['Bangunan Depan', 'Koridor', 'Area Parkir', 'Lingkungan']);
        setShowAddLandmarkForm(false);
        setActiveRoomIdx(null);
        setTemporaryRoom(null);
        setKmListingForm({
            title: req.kost_name,
            description: '',
            address: req.kost_address,
            province: detectProvinceFromAddress(req.kost_address),
            city: 'Makassar',
            area: '',
            type: 'Campur',
            price: 0,
            totalRooms: initialTotalRooms || 0,
            owner_uid: resolvedOwnerUid,
            roomTypes: [],
            publicBathroomFacilities: [],
            publicKitchenFacilities: [],
            publicParkingFacilities: ['Parkir Motor'],
            facilities: ['WiFi', 'Area Parkir', 'Dapur Bersama'],
            location: initialCoords,
            rules: ['Tidak boleh membawa hewan peliharaan', 'Tamu dilarang menginap'],
            image_urls: [],
            campuses: []
        });
    };

    const [uploadingRooms, setUploadingRooms] = useState<Record<string, boolean>>({});

    const handleUploadRoomPhoto = async (typeIdx: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        const file = files[0];
        
        setUploadingRooms(prev => ({ ...prev, [typeIdx]: true }));
        try {
            const folder = `kostmanager/rooms/${Date.now()}`;
            const publicUrl = await uploadFileAndGetURL(file, folder);
            
            setKmListingForm((prev: any) => {
                const updatedRoomTypes = [...prev.roomTypes];
                const rt = updatedRoomTypes[typeIdx];
                const currentImages = rt.images || [];
                updatedRoomTypes[typeIdx] = {
                    ...rt,
                    images: [...currentImages, publicUrl]
                };
                return {
                    ...prev,
                    roomTypes: updatedRoomTypes
                };
            });
            alert('Foto tipe kamar berhasil diunggah!');
        } catch (err) {
            alert('Gagal unggah foto: ' + (err as Error).message);
        } finally {
            setUploadingRooms(prev => ({ ...prev, [typeIdx]: false }));
        }
    };

    const parseShortLinkCoordinates = async (shortUrl: string) => {
        // First try to resolve using our own Firebase Cloud Function
        try {
            const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            const functionUrl = isLocal
                ? `http://localhost:5001/ruangsinggahid-3afb2/us-central1/resolveMapShortLink?url=${encodeURIComponent(shortUrl)}`
                : `https://resolvemapshortlink-hzxlewhsuq-uc.a.run.app?url=${encodeURIComponent(shortUrl)}`;

            const res = await fetch(functionUrl);
            if (res.ok) {
                const data = await res.json();
                if (data.success && data.lat && data.lng) {
                    console.log("parseShortLinkCoordinates: resolved via Cloud Function:", data.lat, data.lng);
                    return { lat: data.lat, lng: data.lng, name: data.name || '' };
                }
            }
        } catch (e) {
            console.error("Firebase Cloud Function resolver failed or emulator not running. Falling back to CORS proxies...", e);
        }

        let html = '';
        
        // 1. Try AllOrigins Proxy
        try {
            const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(shortUrl)}`;
            const res = await fetch(proxyUrl);
            if (res.ok) {
                const data = await res.json();
                html = data.contents || '';
            }
        } catch (e) {
            console.error("AllOrigins proxy failed, trying fallback...", e);
        }

        // 2. Fallback to corsproxy.io (Fixed URL parameter syntax)
        if (!html) {
            try {
                const fallbackUrl = `https://corsproxy.io/?url=${encodeURIComponent(shortUrl)}`;
                const res = await fetch(fallbackUrl);
                if (res.ok) {
                    html = await res.text();
                }
            } catch (e) {
                console.error("Fallback corsproxy failed:", e);
            }
        }

        // 3. Fallback to codetabs proxy
        if (!html) {
            try {
                const fallbackUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(shortUrl)}`;
                const res = await fetch(fallbackUrl);
                if (res.ok) {
                    html = await res.text();
                }
            } catch (e) {
                console.error("Fallback codetabs failed:", e);
            }
        }

        if (!html) {
            console.error("parseShortLinkCoordinates: all CORS proxies failed to retrieve HTML.");
            return null;
        }

        console.log("parseShortLinkCoordinates: successfully retrieved HTML content of length:", html.length);

        try {
            // Search for coordinates in the HTML page content
            // Priority 1: Exact Place Pin coordinates (!3d[lat]!4d[lng])
            const pinRegex = /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/i;
            let match = html.match(pinRegex);

            if (!match) {
                const centerRegex = /center(?:=|\\u003d|%3d)(-?\d+\.\d+)(?:%2C|,|%2c)(-?\d+\.\d+)/i;
                match = html.match(centerRegex);
            }
            
            if (!match) {
                const mapUrlRegex = /(?:@|%40)(-?\d+\.\d+),(?:%2C|,|%2c)?(-?\d+\.\d+)/i;
                match = html.match(mapUrlRegex);
            }
            
            if (!match) {
                const llRegex = /ll(?:=|\\u003d|%3d)(-?\d+\.\d+)(?:%2C|,|%2c)(-?\d+\.\d+)/i;
                match = html.match(llRegex);
            }
            
            if (!match) {
                const qRegex = /[?&]q(?:=|\\u003d|%3d)(-?\d+\.\d+)(?:%2C|,|%2c)(-?\d+\.\d+)/i;
                match = html.match(qRegex);
            }

            let name = '';
            const ogTitleRegex = /<meta\s+property="og:title"\s+content="([^"]+)"/i;
            let ogMatch = html.match(ogTitleRegex);
            if (ogMatch && ogMatch[1]) {
                name = ogMatch[1];
            } else {
                const titleRegex = /<title>([^<]+)<\/title>/i;
                let titleMatch = html.match(titleRegex);
                if (titleMatch && titleMatch[1]) {
                    name = titleMatch[1];
                }
            }
            if (name) {
                name = name.replace(/\s*-\s*Google Maps/i, '').trim();
                if (/^-?\d+\.\d+,\s*-?\d+\.\d+$/.test(name)) {
                    name = '';
                }
            }

            if (match && match[1] && match[2]) {
                return {
                    lat: parseFloat(match[1]),
                    lng: parseFloat(match[2]),
                    name
                };
            }

            // 3. Last resort: scan the HTML for any coordinates within Makassar range
            const makassarCoordsRegex = /(-5\.\d+)\s*(?:,|%2C|%2c)\s*(119\.\d+)/g;
            let m;
            while ((m = makassarCoordsRegex.exec(html)) !== null) {
                const lat = parseFloat(m[1]);
                const lng = parseFloat(m[2]);
                if (lat >= -5.3 && lat <= -4.9 && lng >= 119.3 && lng <= 119.6) {
                    console.log("parseShortLinkCoordinates: extracted Makassar region coordinates via global scan:", lat, lng);
                    let name = '';
                    const ogTitleRegex = /<meta\s+property="og:title"\s+content="([^"]+)"/i;
                    let ogMatch = html.match(ogTitleRegex);
                    if (ogMatch && ogMatch[1]) {
                        name = ogMatch[1];
                    } else {
                        const titleRegex = /<title>([^<]+)<\/title>/i;
                        let titleMatch = html.match(titleRegex);
                        if (titleMatch && titleMatch[1]) {
                            name = titleMatch[1];
                        }
                    }
                    if (name) {
                        name = name.replace(/\s*-\s*Google Maps/i, '').trim();
                        if (/^-?\d+\.\d+,\s*-?\d+\.\d+$/.test(name)) {
                            name = '';
                        }
                    }
                    return { lat, lng, name };
                }
            }
        } catch (err) {
            console.error("Failed to parse short link content:", err);
        }
        return null;
    };

    const parseGoogleMapsUrl = (url: string) => {
        if (!url) return null;
        
        let name = '';
        const placeNameRegex = /\/place\/([^/]+)\//;
        const placeMatch = url.match(placeNameRegex);
        if (placeMatch && placeMatch[1]) {
            try {
                name = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
                if (/^-?\d+\.\d+,\s*-?\d+\.\d+$/.test(name)) {
                    name = '';
                }
            } catch (e) {}
        }

        // Priority 1: Exact Place Pin coordinates (!3d[lat]!4d[lng])
        const pinRegex = /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/i;
        let match = url.match(pinRegex);
        if (match && match[1] && match[2]) {
            return { lat: parseFloat(match[1]), lng: parseFloat(match[2]), name };
        }
        // Format: @-5.1326,119.4886
        const regex1 = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
        // Format: q=-5.1326,119.4886
        const regex2 = /[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/;
        // Format: /maps/place/-5.1326,119.4886
        const regex3 = /\/place\/(-?\d+\.\d+),(-?\d+\.\d+)/;
        // Format raw: -5.1326, 119.4886
        const regexRaw = /^(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)$/;

        match = url.match(regex1);
        if (!match) match = url.match(regex2);
        if (!match) match = url.match(regex3);
        if (!match) match = url.match(regexRaw);

        if (match && match[1] && match[2]) {
            return {
                lat: parseFloat(match[1]),
                lng: parseFloat(match[2]),
                name
            };
        }
        return null;
    };

    const checkHasFacility = (facilityList: string[], target: string) => {
        if (!facilityList || !Array.isArray(facilityList)) return false;
        const normalizedTarget = target.toLowerCase().trim();
        
        // Mapping synonyms across all standard facilities
        const synonyms: Record<string, string[]> = {
            'wifi': ['wifi', 'wi-fi', 'internet'],
            'dapur bersama': ['dapur', 'dapur bersama', 'dapur umum'],
            'area parkir': ['parkir', 'parkiran', 'tempat parkir', 'area parkir', 'parkir motor', 'parkir mobil', 'parkir sepeda'],
            'wc umum': ['wc umum', 'toilet umum', 'kamar mandi luar', 'wc luar'],
            'ruang tamu': ['ruang tamu', 'ruang santai'],
            'cctv': ['cctv', 'kamera keamanan'],
            'laundry': ['laundry', 'mesin cuci', 'cuci'],
            'mushola': ['mushola', 'musholla'],
            'area jemuran': ['area jemuran', 'jemuran', 'tempat jemuran'],
            'security 24 jam': ['security 24 jam', 'security', 'satpam', 'penjaga kost'],
            'akses 24 jam': ['akses 24 jam', 'bebas jam malam', '24 jam'],
            'lift': ['lift'],
            'cleaning service': ['cleaning service', 'pembersihan', 'kebersihan']
        };

        const targetSyns = synonyms[normalizedTarget] || [normalizedTarget];
        
        return facilityList.some(f => {
            const nf = (f || '').toLowerCase().trim();
            return targetSyns.some(syn => nf === syn || nf.includes(syn) || syn.includes(nf));
        });
    };

    const handleSaveKostManagerListing = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isEditingKostManager) return;
        setIsSubmitting(true);
        try {
            const finalPrice = kmListingForm.roomTypes.length > 0 
                ? Math.min(...kmListingForm.roomTypes.map((rt: any) => Number(rt.price)).filter((p: number) => p > 0))
                : 0;

            const validOwnerUid = resolveValidOwnerUid(kmListingForm.owner_uid, isEditingKostManager, mitraProfile);

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

            // Urutkan tipe kamar berdasarkan tarif bulanan tertinggi (paling mahal)
            const getRoomPrice = (r: any) => {
                if (Array.isArray(r.pricing) && r.pricing.length > 0) {
                    const bulanan = r.pricing.find((p: any) => p.period === 'bulanan');
                    if (bulanan && Number(bulanan.price) > 0) return Number(bulanan.price);
                    const maxP = Math.max(...r.pricing.map((p: any) => Number(p.price || 0)));
                    if (maxP > 0) return maxP;
                }
                return Number(r.price || 0);
            };

            const sortedRooms = [...normalizedRoomTypesPayload].sort((a, b) => getRoomPrice(b) - getRoomPrice(a));
            const roomPhotosList: any[] = [];
            sortedRooms.forEach((rm: any) => {
                const rmImgs = Array.isArray(rm.images) ? rm.images : [];
                rmImgs.forEach((img: any, i: number) => {
                    const urlStr = getImageUrlString(img);
                    if (!urlStr) return;
                    const cat = (rm.photoCategories && rm.photoCategories[i]) || `Kamar: ${rm.name || 'Unit'}`;
                    roomPhotosList.push({
                        original: urlStr,
                        url: urlStr,
                        label: cat.startsWith('Kamar:') ? cat : `Kamar: ${rm.name || 'Unit'} - ${cat}`
                    });
                });
            });

            const publicPhotosList = (kmListingForm.image_urls || []).map((img: any, idx: number) => {
                const url = getImageUrlString(img);
                if (!url) return null;
                const label = photoCategories[idx] || (typeof img === 'object' && img.label) || 'Foto Lainnya';
                return { original: url, url: url, label: label };
            }).filter(Boolean);

            // Find propertyId from transaction metadata if exists
            let propertyIdToFetch = null;
            if (isEditingKostManager.transaction_id) {
                const { data: trxData } = await supabase
                    .from('transactions')
                    .select('metadata')
                    .eq('id', isEditingKostManager.transaction_id)
                    .maybeSingle();
                const rawSavePropId = trxData?.metadata?.propertyId;
                const uuidSavePat = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                if (rawSavePropId && uuidSavePat.test(rawSavePropId)) {
                    propertyIdToFetch = rawSavePropId;
                }
            }

            // Fetch existing property for this user to edit
            let query = supabase.from('properties').select('*');
            const uuidSavePat2 = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            let canQuerySaveProperties = false;
            if (propertyIdToFetch) {
                query = query.eq('id', propertyIdToFetch);
                canQuerySaveProperties = true;
            } else if (validOwnerUid && uuidSavePat2.test(validOwnerUid)) {
                query = query.eq('owner_uid', validOwnerUid);
                canQuerySaveProperties = true;
            }
            
            const { data: existingProps } = canQuerySaveProperties
                ? await query
                : { data: null };

            // Prioritize is_managed = true, otherwise take the first one found
            const existingProp = existingProps?.find((p: any) => p.is_managed) || existingProps?.[0];

            const effectiveOwnerUid = resolveValidOwnerUid(
                validOwnerUid,
                isEditingKostManager,
                mitraProfile,
                existingProp?.owner_uid || existingProp?.mitra_id
            );

            // Capture and preserve all original regular Mitra self-listing data (photos, room types, facilities, rules, description)
            const existingSelfListingImages = existingProp?.metadata?.self_listing_images
                || (existingProp && !existingProp.is_managed ? existingProp.image_urls : null)
                || [];
            const existingSelfListingRoomTypes = existingProp?.metadata?.self_listing_room_types
                || (existingProp && !existingProp.is_managed ? existingProp.room_types : null)
                || [];
            const existingSelfListingFacilities = existingProp?.metadata?.self_listing_facilities
                || (existingProp && !existingProp.is_managed ? existingProp.facilities : null)
                || [];
            const existingSelfListingRules = existingProp?.metadata?.self_listing_rules
                || (existingProp && !existingProp.is_managed ? existingProp.rules : null)
                || [];
            const existingSelfListingDescription = existingProp?.metadata?.self_listing_description
                || (existingProp && !existingProp.is_managed ? existingProp.description : null)
                || '';
            const existingSelfListingPhotosMeta = existingProp?.metadata?.self_listing_photos_meta
                || (existingProp && !existingProp.is_managed ? existingProp.metadata?.photos_meta : null)
                || [];
            const existingSelfListingCategorizedPhotos = existingProp?.metadata?.self_listing_categorized_photos
                || (existingProp && !existingProp.is_managed ? (existingProp.metadata?.categorized_photos || existingProp.categorized_photos) : null)
                || {};
            const existingSelfListingPhotoCategories = existingProp?.metadata?.self_listing_photo_categories
                || (existingProp && !existingProp.is_managed ? (existingProp.metadata?.photo_categories || existingProp.photo_categories) : null)
                || [];

            const propertyPayload = {
                title: kmListingForm.title,
                description: kmListingForm.description,
                address: kmListingForm.address,
                city: kmListingForm.city,
                area: kmListingForm.area,
                type: kmListingForm.type,
                price: finalPrice,
                owner_uid: effectiveOwnerUid,
                mitra_id: effectiveOwnerUid, // Add valid mitra_id for not-null DB constraint
                room_types: normalizedRoomTypesPayload,
                status: 'published',
                is_managed: true,
                facilities: kmListingForm.facilities,
                location: kmListingForm.location,
                rules: kmListingForm.rules,
                image_urls: roomPhotosList.length > 0 ? [...roomPhotosList, ...publicPhotosList] : publicPhotosList,
                campuses: kmListingForm.campuses,
                metadata: {
                    ...(existingProp?.metadata || {}),
                    province: kmListingForm.province || '',
                    publicParkingFacilities: kmListingForm.publicParkingFacilities || ['Parkir Motor'],
                    publicKitchenFacilities: kmListingForm.publicKitchenFacilities || [],
                    publicBathroomFacilities: kmListingForm.publicBathroomFacilities || [],
                    addressNotes: kmListingForm.addressNotes || '',
                    signature_data: signatureData || null,
                    agreed_to_terms: agreedToTerms,
                    // ISOLATED SELF-LISTING BACKUP (preserved when KostManager subscription is cancelled/downgraded):
                    self_listing_images: existingSelfListingImages.length > 0 ? existingSelfListingImages : (existingProp?.image_urls || []),
                    self_listing_room_types: existingSelfListingRoomTypes.length > 0 ? existingSelfListingRoomTypes : (existingProp?.room_types || []),
                    self_listing_facilities: existingSelfListingFacilities.length > 0 ? existingSelfListingFacilities : (existingProp?.facilities || []),
                    self_listing_rules: existingSelfListingRules.length > 0 ? existingSelfListingRules : (existingProp?.rules || []),
                    self_listing_description: existingSelfListingDescription || existingProp?.description || '',
                    self_listing_photos_meta: existingSelfListingPhotosMeta.length > 0 ? existingSelfListingPhotosMeta : (existingProp?.metadata?.photos_meta || []),
                    self_listing_categorized_photos: Object.keys(existingSelfListingCategorizedPhotos).length > 0 ? existingSelfListingCategorizedPhotos : (existingProp?.metadata?.categorized_photos || {}),
                    self_listing_photo_categories: existingSelfListingPhotoCategories.length > 0 ? existingSelfListingPhotoCategories : (existingProp?.metadata?.photo_categories || []),
                    kostmanager_survey_completed_at: new Date().toISOString()
                }
            };

            let savedProperty = null;
            if (existingProp) {
                const { data, error } = await supabase.from('properties').update(propertyPayload).eq('id', existingProp.id).select().maybeSingle();
                if (error) throw error;
                savedProperty = data;
            } else {
                const { data, error } = await supabase.from('properties').insert([propertyPayload]).select().maybeSingle();
                if (error) throw error;
                savedProperty = data;
            }

            // Save to dedicated mitra_kostmanager table for mitra kost manager listings
            if (savedProperty) {
                const kmPropertyPayload = {
                    property_id: savedProperty.id,
                    owner_uid: effectiveOwnerUid,
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

                const { data: existingKmProp } = await supabase
                    .from('mitra_kostmanager')
                    .select('id')
                    .eq('property_id', savedProperty.id)
                    .maybeSingle();

                if (existingKmProp) {
                    const { error } = await supabase.from('mitra_kostmanager').update(kmPropertyPayload).eq('id', existingKmProp.id);
                    if (error) console.error("Error updating dedicated mitra_kostmanager table:", error);
                } else {
                    const { error } = await supabase.from('mitra_kostmanager').insert([kmPropertyPayload]);
                    if (error) console.error("Error inserting dedicated mitra_kostmanager table:", error);
                }
            }

            // Sync status & digital signature to SUBMITTED & PENDING_ONBOARDING across all relevant tables
            const kmSurveyId = (isEditingKostManager as any).kostmanager_survey_id || isEditingKostManager.id;
            if (kmSurveyId) {
                const { error: kmSurvErr } = await supabase
                    .from('kostmanager_surveys')
                    .update({ 
                        status: 'SUBMITTED', 
                        signature_data: signatureData || null,
                        updated_at: new Date().toISOString() 
                    })
                    .eq('id', kmSurveyId);
                if (kmSurvErr) console.error("Error updating kostmanager_surveys status and signature:", kmSurvErr);
            }

            const kmRequestId = (isEditingKostManager as any).kostmanager_request_id || (isEditingKostManager as any).request_id;
            if (kmRequestId) {
                const { error: kmReqErr } = await supabase
                    .from('kostmanager_requests')
                    .update({ 
                        status: 'PENDING_ONBOARDING',
                        property_id: savedProperty?.id || null,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', kmRequestId);
                if (kmReqErr) console.error("Error updating kostmanager_requests status by ID:", kmReqErr);

                // Also update kostmanager_surveys by kostmanager_request_id as fallback
                await supabase
                    .from('kostmanager_surveys')
                    .update({ 
                        status: 'SUBMITTED', 
                        signature_data: signatureData || null,
                        updated_at: new Date().toISOString() 
                    })
                    .eq('kostmanager_request_id', kmRequestId);
            }

            if (isEditingKostManager.transaction_id) {
                const { error: kmReqTrxErr } = await supabase
                    .from('kostmanager_requests')
                    .update({ 
                        status: 'PENDING_ONBOARDING',
                        property_id: savedProperty?.id || null,
                        updated_at: new Date().toISOString()
                    })
                    .eq('transaction_id', isEditingKostManager.transaction_id);
                if (kmReqTrxErr) console.error("Error updating kostmanager_requests status by transaction_id:", kmReqTrxErr);

                await supabase.from('survey_requests')
                    .update({ 
                        status: 'SUBMITTED', 
                        signature_data: signatureData || null,
                        updated_at: new Date().toISOString() 
                    })
                    .eq('transaction_id', isEditingKostManager.transaction_id);
            }

            // Clean up temporary draft snapshot from survey_requests (leave official listing in properties and mitra_kostmanager intact)
            try {
                const currentEval = isEditingKostManager.evaluation_summary || {};
                const cleanedEval = { ...(typeof currentEval === 'object' ? currentEval : {}) };
                delete cleanedEval.draft_data;
                delete cleanedEval.last_draft_updated_at;

                await supabase
                    .from('survey_requests')
                    .update({ 
                        status: 'SUBMITTED', 
                        signature_data: signatureData || null,
                        evaluation_summary: Object.keys(cleanedEval).length > 0 ? cleanedEval : null,
                        updated_at: new Date().toISOString() 
                    })
                    .eq('id', isEditingKostManager.id);
            } catch (cleanErr) {
                console.warn("Could not clean draft_data on finalize:", cleanErr);
            }

            alert('Listing properti & kamar berhasil disimpan! Status pengajuan kini PENDING ONBOARDING.');
            localStorage.removeItem(`km_draft_${isEditingKostManager.id}`);
            closeKostManagerListing();
            const cleanupParamsSave = new URLSearchParams(searchParams);
            cleanupParamsSave.delete('onboarding_id');
            setSearchParams(cleanupParamsSave);
            await loadSurveyRequests();
        } catch (err) {
            console.error('Error saving listing:', err);
            alert('Gagal menyimpan listing: ' + (err as Error).message);
        } finally {
            setIsSubmitting(false);
        }
    };

        // Fungsi untuk mendapatkan pendapatan riil yang masuk ke agen (berdasarkan nominal Rupiah flat komisi agen)
    const getSurveyEarnings = (r: SurveyRequest): number => {
        const trx = r.transaction;

        // Jika pesanan adalah KostManager Onboarding, gunakan harga nominal transaksi berlangganan KostManager
        if (r.notes?.includes('KostManager')) {
            if (trx && trx.amount) {
                return Number(trx.amount);
            }
            return 150000; // Standar harga berlangganan KostManager sebagai fallback
        }

        const txDate = new Date((trx as any)?.created_at || r.created_at);
        // Tanggal 16 Juni 2026 pukul 00:00:00 (WIB/WITA UTC+8)
        const cutoffTime = new Date("2026-06-16T00:00:00+08:00").getTime();

        // 1. Kondisi Khusus: Transaksi dari awal hingga 15 Juni 2026 mendapatkan komisi 100% dari harga flat Rp 35.000
        if (txDate.getTime() < cutoffTime) {
            return 35000;
        }

        if (!trx) {
            return agentCommissionFlat;
        }
        
        const metadata = trx.metadata || {};
        const amount = Number(trx.amount) || 0;
        const kostList = Array.isArray(metadata.kostList) ? metadata.kostList : [];
        const count = Number(metadata.kost_count) || kostList.length || 1;
        const unitPrice = amount / count;

        // 2. Transaksi tanggal 16 Juni 2026 ke atas: Mengikuti log perubahan atau stempel metadata transaksi
        // Prioritas A: Stempel nominal flat komisi historis di metadata transaksi
        if (metadata.agent_commission_flat !== undefined) {
            return Number(metadata.agent_commission_flat);
        }

        // Prioritas B: Cari nominal dari riwayat log perubahan yang aktif di periode tanggal transaksi tersebut
        if (changeLogs && changeLogs.length > 0) {
            const txTime = txDate.getTime();
            // Cari log yang dibuat sebelum atau sama dengan waktu transaksi, urutkan dari yang paling baru
            const activeLog = changeLogs
                .filter(log => new Date(log.timestamp).getTime() <= txTime)
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

            if (activeLog && activeLog.agent_commission_flat !== undefined) {
                return Number(activeLog.agent_commission_flat);
            }
        }

        // Prioritas C: Fallback jika order pasca 16 Juni tapi log belum ter-record, gunakan global commission saat ini
        return agentCommissionFlat;
    };

    const completedSurveys = surveyRequests.filter(r => r.status === 'COMPLETED');
    const ratings = completedSurveys.map(r => r.user_rating || 0).filter(r => r > 0);
    const avgRating = ratings.length > 0 
        ? Number((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)) 
        : 5.0;

    const totalEarnings = completedSurveys.reduce((sum, r) => {
        return sum + getSurveyEarnings(r);
    }, 0);

    const totalWithdrawn = withdrawalHistory
        .filter(w => w.status !== 'rejected')
        .reduce((sum, w) => sum + Number(w.amount), 0);

    const availableBalance = Math.max(0, totalEarnings - totalWithdrawn);

    const stats = {
        total: surveyRequests.length,
        completed: completedSurveys.length,
        rating: avgRating,
        earnings: totalEarnings,
        availableBalance: availableBalance
    };

    const inTx = completedSurveys.map(r => {
        const earned = getSurveyEarnings(r);
        return {
            id: `in-${r.id}`,
            date: new Date(r.created_at),
            type: 'IN',
            title: r.kost_name,
            amount: earned,
            status: 'approved'
        };
    });

    const outTx = withdrawalHistory.filter(w => w.status !== 'rejected').map(w => ({
        id: `out-${w.id}`,
        date: new Date(w.created_at),
        type: 'OUT',
        title: `Penarikan Dana (${w.bank_name})`,
        amount: Number(w.amount),
        status: w.status
    }));

    const allTransactions = [...inTx, ...outTx]
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .slice(0, 5);

    const handleWithdraw = async () => {
        if (availableBalance < 10000) {
            alert('Saldo minimal untuk penarikan adalah Rp 10.000');
            return;
        }
        if (!agentBankName || !agentBankAccount || !agentAccountName) {
            alert('Silakan lengkapi dan simpan data rekening Anda terlebih dahulu.');
            return;
        }
        setIsWithdrawing(true);
        try {
            const { error } = await supabase
                .from('withdrawal_requests')
                .insert([{
                    agent_id: uid,
                    amount: availableBalance,
                    bank_name: agentBankName,
                    bank_account: agentBankAccount,
                    bank_account_name: agentAccountName,
                    status: 'pending'
                }]);
            if (error) throw error;

            alert('Pengajuan penarikan berhasil dikirim!');
            setShowWithdrawConfirm(false);
            await loadWalletData();

            // Kirim notifikasi email ke Admin via FormSubmit
            notifyAdminWithdrawalRequest({
                agent_id: uid,
                agent_name: user?.displayName || user?.name || 'Surveyor',
                amount: availableBalance,
                bank_name: agentBankName,
                bank_account: agentBankAccount,
                bank_account_name: agentAccountName
            });
        } catch (error) {
            console.error('Error submitting withdrawal:', error);
            alert('Gagal mengirim pengajuan penarikan.');
        } finally {
            setIsWithdrawing(false);
        }
    };
    const getSurveyWorkDate = (r: any): Date => {
        if (r.evaluation_summary?.submitted_at) {
            return new Date(r.evaluation_summary.submitted_at);
        }
        const summary = r.evaluation_summary || {};
        for (const key in summary) {
            if (key.endsWith('_photos') && Array.isArray(summary[key])) {
                for (const url of summary[key]) {
                    if (typeof url === 'string') {
                        const match = url.match(/\/(\d+)_[a-zA-Z0-9]+\.webp/);
                        if (match && match[1]) {
                            const epoch = parseInt(match[1]);
                            if (epoch > 1700000000000 && epoch < 2000000000000) {
                                return new Date(epoch);
                            }
                        }
                    }
                }
            }
        }
        return new Date(r.created_at);
    };

    const getWeeklyData = () => {
        const daysMap = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
        const result = [];
        const now = new Date();

        for (let i = 6; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(now.getDate() - i);
            
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);

            const dayLabel = daysMap[date.getDay()];
            
            const tasksCount = completedSurveys.filter(r => {
                const workDate = getSurveyWorkDate(r);
                return workDate >= startOfDay && workDate <= endOfDay;
            }).length;

            result.push({
                day: dayLabel,
                tasks: tasksCount
            });
        }

        return result;
    };

    const weeklyData = getWeeklyData();

    const handleUpdateSurvey = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isEditingSurvey) return;

        // Validation: Ensure all 7 points are filled and have photos
        const requiredSections = [
            { id: 'room_facilities', label: 'Fasilitas Kamar' },
            { id: 'bathroom_facilities', label: 'Fasilitas WC' },
            { id: 'water_check', label: 'Pengecekan Air' },
            { id: 'wifi_check', label: 'Pengecekan WiFi' },
            { id: 'security_check', label: 'Pengecekan Keamanan' },
            { id: 'access_check', label: 'Akses Umum/Toko/Kampus' },
            { id: 'environmental_conditions', label: 'Kondisi Lingkungan Sekitar Kost' }
        ];

        const missing = [];
        for (const section of requiredSections) {
            const text = (surveyForm.evaluation_summary as any)?.[section.id];
            const photos = (surveyForm.evaluation_summary as any)?.[`${section.id}_photos`];
            const rating = (surveyForm.evaluation_summary as any)?.[`${section.id}_rating`];
            
            if (!text || text.trim().length < 1) {
                missing.push(`${section.label} (Keterangan belum diisi)`);
            }
            if (!photos || photos.length === 0) {
                missing.push(`${section.label} (Foto bukti belum diupload)`);
            }
            if (!rating || rating === 0) {
                missing.push(`${section.label} (Rating bintang belum dipilih)`);
            }
        }

        if (missing.length > 0) {
            alert(`Laporan belum lengkap! Mohon lengkapi bagian berikut:\n\n- ${missing.join('\n- ')}`);
            return;
        }

        setIsSubmitting(true);
        try {
            // Change status to SUBMITTED for user confirmation
            const finalForm = {
                ...surveyForm,
                status: 'SUBMITTED',
                evaluation_summary: {
                    ...(surveyForm.evaluation_summary || {}),
                    submitted_at: new Date().toISOString()
                }
            };
            await updateSurveyRequest(isEditingSurvey.id, finalForm);
            await notifySurveyStatusUpdate(isEditingSurvey.id, 'SUBMITTED');
            localStorage.removeItem(`survey_draft_${isEditingSurvey.id}`);
            setIsEditingSurvey(null);
            alert('Laporan berhasil dikirim! Menunggu konfirmasi dari User.');
            await loadSurveyRequests();
            setAgentTab('history');
        } catch (error) {
            console.error('Error updating survey:', error);
            alert('Gagal update survey');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSurveyPhotoUpload = async (sectionId: string, files: FileList | null) => {
        if (!files || !isEditingSurvey) return;
        setIsUploadingSurveyPhoto(sectionId);
        try {
            const uploadedUrls: string[] = [];
            for (let i = 0; i < files.length; i++) {
                const url = await uploadSurveyPhoto(files[i], isEditingSurvey.id);
                uploadedUrls.push(url);
            }
            
            if (sectionId === 'whatsapp_evidence_url') {
                setSurveyForm({
                    ...surveyForm,
                    evaluation_summary: {
                        ...(surveyForm.evaluation_summary || {}),
                        whatsapp_evidence_url: uploadedUrls[0]
                    }
                });
            } else {
                const currentPhotos = (surveyForm.evaluation_summary as any)?.[`${sectionId}_photos`] || [];
                setSurveyForm({
                    ...surveyForm,
                    evaluation_summary: {
                        ...(surveyForm.evaluation_summary || {}),
                        [`${sectionId}_photos`]: [...currentPhotos, ...uploadedUrls]
                    }
                });
            }
        } catch (error) {
            console.error('Error uploading photo:', error);
            alert('Gagal upload foto');
        } finally {
            setIsUploadingSurveyPhoto(null);
        }
    };

    const handleRemoveSurveyPhoto = async (sectionId: string, url: string) => {
        if (!isEditingSurvey) return;
        if (!window.confirm('Hapus foto ini?')) return;
        try {
            await deleteSurveyPhoto(url);
            const currentPhotos = (surveyForm.evaluation_summary as any)?.[`${sectionId}_photos`] || [];
            setSurveyForm({
                ...surveyForm,
                evaluation_summary: {
                    ...(surveyForm.evaluation_summary || {}),
                    [`${sectionId}_photos`]: currentPhotos.filter((p: string) => p !== url)
                }
            });
        } catch (error) {
            console.error('Error deleting photo:', error);
        }
    };

    const handleRequestReschedule = async () => {
        if (!isReschedulingSurvey) return;
        setIsSubmitting(true);
        try {
            // Build reschedule history
            const currentSummary = isReschedulingSurvey.evaluation_summary || {};
            const newHistoryItem = {
                date: newSurveyDate,
                time: newSurveyTime,
                reason: rescheduleReason,
                updatedAt: new Date().toISOString()
            };
            const rescheduleHistory = Array.isArray((currentSummary as any).reschedule_history)
                ? [...(currentSummary as any).reschedule_history, newHistoryItem]
                : [newHistoryItem];
            
            const updatedSummary = {
                ...currentSummary,
                reschedule_history: rescheduleHistory
            };

            await updateSurveyRequest(isReschedulingSurvey.id, {
                status: 'RESCHEDULED',
                survey_date: newSurveyDate,
                survey_time: newSurveyTime,
                notes: rescheduleReason,
                evaluation_summary: updatedSummary
            });
            await notifySurveyStatusUpdate(isReschedulingSurvey.id, 'RESCHEDULED');
            setIsReschedulingSurvey(null);
            await loadSurveyRequests();
        } catch (error) {
            console.error('Error rescheduling:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // ── UI HELPERS ─────────────────────────────────────────────────────────────
    const NAV_ITEMS = [
        { key: 'overview', icon: <Zap size={20} />, label: 'Beranda' },
        { key: 'tasks', icon: <ClipboardList size={20} />, label: 'Tugas', badge: surveyRequests.filter(r => r.status === 'PENDING_ASSIGNMENT').length },
        { key: 'wallet', icon: <Wallet size={20} />, label: 'Dompet' },
        { key: 'profile', icon: <User size={20} />, label: 'Profil' },
    ];

    const SideNavItem: React.FC<{ active: boolean; icon: React.ReactNode; label: string; onClick: () => void; badge?: number }> = ({ active, icon, label, onClick, badge }) => (
        <button
            onClick={onClick}
            className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-300 group ${
                active ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20 translate-x-1' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
            }`}
        >
            <div className="flex items-center gap-3">
                <span className={`transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>{icon}</span>
                <span className={`text-sm ${active ? 'font-black' : 'font-bold'}`}>{label}</span>
            </div>
            {badge !== undefined && badge > 0 && (
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${active ? 'bg-white text-orange-600' : 'bg-rose-500 text-white'}`}>
                    {badge}
                </span>
            )}
        </button>
    );

    const BottomNavItem: React.FC<{ active: boolean; icon: React.ReactNode; label: string; onClick: () => void; badge?: number }> = ({ active, icon, label, onClick, badge }) => (
        <button
            onClick={onClick}
            className={`flex-1 flex flex-col items-center gap-1 py-1 px-1 rounded-2xl transition-all relative ${active ? 'text-orange-500' : 'text-gray-400'}`}
        >
            <div className={`transition-transform duration-300 ${active ? 'scale-110 -translate-y-1' : ''}`}>
                {icon}
                {badge !== undefined && badge > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[8px] font-black flex items-center justify-center rounded-full border-2 border-white animate-bounce-short">
                        {badge}
                    </span>
                )}

            </div>
            <span className={`text-[9px] uppercase tracking-tighter transition-all ${active ? 'font-black opacity-100' : 'font-bold opacity-60'}`}>{label}</span>
            {active && <div className="absolute -bottom-1 w-1.5 h-1.5 bg-orange-500 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.4)]" />}
        </button>
    );

    const categoryChecklists: Record<string, string[]> = {
        kost_type: ['Putra', 'Putri', 'Campur', 'Pasutri'],
        room_facilities: ['Tanpa Fasilitas', 'Tempat Tidur', 'Bantal', 'Sprei', 'Lemari Pakaian', 'Meja Belajar/Kerja', 'Kursi', 'Cermin', 'Rak Sepatu', 'AC', 'Kipas Angin', 'TV', 'Kulkas', 'Stop Kontak', 'Listrik/Kamar'],
        bathroom_facilities: ['WC Dalam', 'WC Umum', 'Kloset Duduk', 'Kloset Jongkok', 'Shower', 'Bak Mandi', 'Gayung', 'Ember', 'Wastafel', 'Cermin WC', 'Gantungan Baju', 'Exhaust Fan', 'Water Heater'],
        kitchen_facilities: ['Dapur Umum', 'Dapur Dalam', 'Kompor', 'Gas', 'Kulkas', 'Wastafel Dapur', 'Rak Piring', 'Meja Dapur', 'Alat Masak', 'Alat Makan', 'Tempat Sampah'],
        public_facilities: ['Ruang Tamu', 'Dapur Bersama', 'WiFi', 'Listrik Umum', 'Jemuran', 'Mesin Cuci', 'Ruang Santai', 'Parkir Motor', 'Parkir Mobil'],
        water_check: ['Air Bersih/Jernih', 'Air Tidak Berbau', 'Aliran Air Deras', 'Keran Berfungsi Baik'],
        wifi_check: ['Tidak Ada WiFi'],
        security_check: ['CCTV Aktif', 'Gembok/Pagar', 'Akses 24 Jam', 'Batas Jam Malam', 'Penjaga Kos/Satpam', 'Lingkungan Aman'],
        access_check: ['Akses Mobil Mudah', 'Akses Motor Mudah', 'Dalam Gang', 'Dekat Jalan Utama', 'Dekat Masjid', 'Dekat Gereja', 'Dekat Warung Makan', 'Dekat Minimarket', 'Dekat Toko Grosir', 'Dekat Kampus/Kantor', 'Jalanan Beraspal', 'Bebas Banjir'],
        environmental_conditions: ['Area Kostan', 'Area Perumahan', 'Padat Penduduk', 'Lingkungan Tenang', 'Bebas Bau/Polusi', 'Pencahayaan Baik', 'Bebas Hewan/Serangga'],
        building_conditions: ['Bangunan Baru', 'Bangunan Terawat', 'Cat Masih Bagus', 'Tidak Ada Retak', 'Atap Tidak Bocor', 'Tidak Ada Rembes', 'Tidak Ada Jamur Dinding', 'Sirkulasi Udara Lancar']
    };

    const StarRatingInput: React.FC<{ value: number; onChange: (rating: number) => void; disabled?: boolean }> = ({ value, onChange, disabled }) => (
        <div className="flex gap-1 sm:gap-1.5 p-1.5 sm:p-2 bg-gray-50/80 rounded-xl border border-gray-100 hover:border-orange-200 transition-colors">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    disabled={disabled}
                    onClick={() => onChange(star)}
                    className={`text-xl sm:text-2xl transition-all duration-200 w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center ${
                        star <= value 
                        ? 'text-yellow-400 bg-yellow-50 drop-shadow-[0_0_8px_rgba(250,204,21,0.3)] scale-110 border border-yellow-200' 
                        : 'text-gray-300 bg-white hover:bg-gray-100 hover:text-gray-400 border border-gray-200 shadow-sm'
                    } ${!disabled && 'active:scale-95 cursor-pointer'} ${disabled && 'cursor-not-allowed opacity-70'}`}
                >
                    {star <= value ? '★' : '☆'}
                </button>
            ))}
        </div>
    );

    const renderOverview = () => (
        <div className="space-y-6">
            {verificationStatus !== 'verified' && (
                <div className="bg-orange-50 border border-orange-200 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm animate-pulse">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-2xl">⚠️</div>
                        <div>
                            <h4 className="text-orange-900 font-black uppercase text-sm">Akun Belum Terverifikasi</h4>
                            <p className="text-orange-700 text-xs font-medium">Lengkapi identitas Anda di menu Profil untuk mulai menerima tugas survey.</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => onMenuChange('profile')}
                        className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-orange-200"
                    >
                        Verifikasi Sekarang
                    </button>
                </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><span className="text-sm">🎯</span> Total Tugas</p>
                    <p className="text-2xl font-black text-gray-900 leading-tight">{stats.total}</p>
                    <p className="text-[10px] text-green-500 font-bold mt-1 uppercase tracking-tight">+12% vs bulan lalu</p>
                </div>
                <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><span className="text-sm">✅</span> Survey Selesai</p>
                    <p className="text-2xl font-black text-gray-900 leading-tight">{stats.completed}</p>
                    <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-tight">Tingkat sukses 100%</p>
                </div>
                <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><span className="text-sm">⭐</span> Rating Rata-rata</p>
                    <p className="text-2xl font-black text-orange-600 leading-tight">{stats.rating}</p>
                    <div className="flex text-yellow-400 text-[10px] mt-1 tracking-tighter">
                        {[...Array(5)].map((_, idx) => (
                            <span key={idx}>{idx < Math.round(stats.rating) ? '★' : '☆'}</span>
                        ))}
                    </div>
                </div>
                <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><span className="text-sm">💰</span> Total Pendapatan</p>
                    <p className="text-2xl font-black text-orange-600 leading-tight">{FORMAT_CURRENCY(stats.earnings)}</p>
                    <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-tight">Per 30 hari terakhir</p>
                </div>
            </div>

            {/* ===== BANNER CAMPAIGN REFERRAL MITRA ===== */}
            <div className="rounded-3xl overflow-hidden shadow-sm">
                {/* Banner utama — klik menuju artikel penjelasan campaign */}
                <a
                    href="/artikel/program-referral-agen-ajak-mitra-bonus-50rb"
                    className="block relative bg-gradient-to-r from-orange-500 to-amber-400 p-5 sm:p-6 hover:from-orange-600 hover:to-amber-500 transition-all duration-300 group cursor-pointer"
                    aria-label="Pelajari Program Referral Agen Mitra"
                >
                    {/* Dekorasi bulatan transparan */}
                    <div className="absolute right-0 top-0 w-40 h-40 bg-white/10 rounded-bl-full -mr-10 -mt-10 pointer-events-none" />
                    <div className="absolute left-10 bottom-0 w-24 h-24 bg-white/5 rounded-full -mb-12 pointer-events-none" />

                    <div className="relative z-10 flex items-center justify-between gap-4">
                        <div className="flex-1">
                            <p className="text-[9px] font-black text-orange-100 uppercase tracking-widest mb-1">🎁 Program Eksklusif Agen</p>
                            <h3 className="text-base sm:text-lg font-black text-white leading-tight">
                                Ajak Pemilik Kost Bergabung,
                                <span className="block">Bonus <span className="text-yellow-200">Rp 50.000</span> per Mitra!</span>
                            </h3>
                            <p className="text-xs text-orange-100 font-medium mt-1.5 leading-snug max-w-xs">
                                Bagikan kode referralmu saat survey. Semakin banyak mitra, semakin besar penghasilan tambahanmu.
                            </p>
                        </div>
                        <div className="shrink-0 flex flex-col items-center gap-2">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 group-hover:bg-white/30 rounded-2xl flex items-center justify-center transition-all border border-white/30 group-hover:scale-110">
                                <span className="text-xl sm:text-2xl">→</span>
                            </div>
                            <span className="text-[9px] text-orange-100 font-black uppercase tracking-wider text-center">Pelajari</span>
                        </div>
                    </div>
                </a>

                {/* Ticker pemilik kost yang sudah bergabung via referral */}
                <div className="bg-orange-50 border-t border-orange-100 px-4 sm:px-5 py-2.5 flex items-center gap-3">
                    {referralHistory.length > 0 ? (
                        <>
                            <span className="text-[9px] font-black text-orange-400 uppercase tracking-widest shrink-0">Referralmu:</span>
                            <div
                                className="flex-1 overflow-hidden relative h-4 cursor-pointer"
                                onClick={() => onMenuChange('profile')}
                                title="Lihat semua riwayat referral di profil"
                            >
                                <div
                                    className="absolute inset-0 flex items-center transition-all duration-700 ease-in-out"
                                    style={{ transform: `translateY(0)` }}
                                >
                                    <span className="text-xs font-black text-orange-700 truncate animate-in fade-in duration-500">
                                        {referralHistory[referralTickerIndex].name.substring(0, 3)}*** bergabung sebagai Mitra •
                                        <span className="font-bold text-orange-500 ml-1">+Rp 50.000 bonus</span>
                                    </span>
                                </div>
                            </div>
                            <span className="text-[9px] font-black text-orange-300 uppercase tracking-wider shrink-0">
                                {referralHistory.length} Mitra
                            </span>
                        </>
                    ) : (
                        <>
                            <span className="text-[9px] font-black text-orange-300 uppercase tracking-widest">Belum ada mitra yang bergabung via kode referralmu</span>
                            <span className="text-[9px] text-orange-300 font-bold ml-auto shrink-0">Mulai sekarang →</span>
                        </>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">Aktivitas Survey 7 Hari Terakhir</h4>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Total {weeklyData.reduce((a, b) => a + b.tasks, 0)} Tugas Berhasil</p>
                        </div>
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={weeklyData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#9CA3AF' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#9CA3AF' }} dx={-10} allowDecimals={false} />
                                <RechartsTooltip 
                                    cursor={{fill: '#F9FAFB'}}
                                    wrapperStyle={{ outline: 'none' }}
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 800, fontSize: '12px', outline: 'none' }}
                                />
                                <Bar dataKey="tasks" fill="#f97316" radius={[6, 6, 0, 0]} barSize={24} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-orange-600 rounded-3xl p-6 text-white shadow-xl shadow-orange-100 relative overflow-hidden flex flex-col">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full -mr-16 -mt-16 blur-2xl"></div>
                    <div className="relative z-10 flex-grow">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">Status Performa</p>
                        <h4 className="text-xl font-black leading-tight mb-4">Luar Biasa, {user?.displayName?.split(' ')[0] || 'Agen'}! 🚀</h4>
                        <p className="text-xs leading-relaxed opacity-90 mb-6 font-medium">Bulan ini kamu sudah menyelesaikan <strong>{stats.completed} survey</strong> dengan tingkat kepuasan pelanggan yang sangat tinggi. Pertahankan respon cepatmu!</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm relative overflow-hidden">
                 <div className="flex justify-between items-center mb-6">
                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">Tanggapan Pengguna</h4>
                    <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-lg">New Feedback</span>
                </div>
                <div className="space-y-4">
                    {surveyRequests.filter(r => r.status === 'COMPLETED' && r.user_comment).slice(0, 2).map((r, i) => (
                        <div key={i} className="flex gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-lg shrink-0">👤</div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <p className="text-xs font-black text-gray-900">{r.user?.name || 'User'}</p>
                                    <div className="flex text-yellow-400 text-[8px]">
                                        {[...Array(5)].map((_, idx) => (
                                            <span key={idx}>{idx < (r.user_rating || 0) ? '★' : '☆'}</span>
                                        ))}
                                    </div>
                                </div>
                                <p className="text-xs text-gray-600 italic leading-relaxed">"{r.user_comment}"</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderRoomEditor = (rt: any, idx: number) => {
        const activeRoomIdx = idx;
        const isOccupied = rt.isAvailable === false || rt.status === 'Terisi';
        const roomEval = parseEvaluationData(isEditingKostManager?.notes, isEditingKostManager?.status);

        const updateRoomFacilitiesWithPhotos = (newFacilities: string[], newStatus?: string) => {
            const statusToUse = newStatus !== undefined ? newStatus : (isOccupied ? 'Terisi' : 'Kosong');
            const currentCategorized = getRoomCategorizedPhotos(rt);

            // Re-key Interior category if status changed between Terisi and Kosong
            const updatedCategorized: Record<string, string[]> = {};
            Object.entries(currentCategorized).forEach(([catKey, urls]) => {
                if (catKey.includes('Interior')) {
                    const newKey = statusToUse === 'Terisi' ? 'Interior Kamar (Opsional)' : 'Interior Kamar *Wajib';
                    updatedCategorized[newKey] = urls;
                } else {
                    updatedCategorized[catKey] = urls;
                }
            });

            const { images, photoCategories } = exportCategorizedPhotos(updatedCategorized);

            const updatedRoomTypes = [...kmListingForm.roomTypes];
            updatedRoomTypes[activeRoomIdx] = { 
                ...rt, 
                ...(newStatus !== undefined ? { status: newStatus, isAvailable: newStatus !== 'Terisi' } : {}),
                roomFacilities: newFacilities,
                categorized_photos: updatedCategorized,
                categorizedPhotos: updatedCategorized,
                photoCategories,
                images
            };
            setKmListingForm({ ...kmListingForm, roomTypes: updatedRoomTypes });
        };

        return (
            <div className="p-4 space-y-5 cursor-default text-left border-t border-[#ffe2cc] bg-[#fffcfb]" onClick={e => e.stopPropagation()}>
                {/* Detail Kamar Section (Nomor Kamar, Lantai, Tipe Kamar, Luas Kamar, Status Kamar) */}
                <div className="border border-gray-150 rounded-xl p-4 flex flex-col gap-3.5 bg-gray-50/30">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b border-gray-100 pb-1">
                        Detail Kamar (Dapat Diedit)
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Nomor Kamar */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-bold text-[#584235] uppercase tracking-wider">Nomor Kamar</label>
                            <input 
                                type="text"
                                value={rt.name || ''}
                                onChange={e => {
                                    const updatedRoomTypes = [...kmListingForm.roomTypes];
                                    updatedRoomTypes[idx] = { ...rt, name: e.target.value };
                                    setKmListingForm({ ...kmListingForm, roomTypes: updatedRoomTypes });
                                }}
                                className="w-full h-[40px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white font-bold outline-none text-[#584235]"
                                placeholder="Nomor Kamar"
                            />
                        </div>
                        {/* Lantai */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-bold text-[#584235] uppercase tracking-wider">Lantai</label>
                            <select 
                                value={rt.floor || ''}
                                onChange={e => {
                                    const updatedRoomTypes = [...kmListingForm.roomTypes];
                                    updatedRoomTypes[idx] = { ...rt, floor: e.target.value };
                                    setKmListingForm({ ...kmListingForm, roomTypes: updatedRoomTypes });
                                }}
                                className="w-full h-[40px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white font-bold outline-none text-[#584235]"
                            >
                                <option value="" disabled hidden>Pilih Lantai</option>
                                <option value="Lantai 1">Lantai 1</option>
                                <option value="Lantai 2">Lantai 2</option>
                                <option value="Lantai 3">Lantai 3</option>
                                <option value="Lantai 4">Lantai 4</option>
                            </select>
                        </div>
                        {/* Tipe Kamar */}
                        <div className="md:col-span-2 flex flex-col gap-1.5">
                            <label className="text-[11px] font-bold text-[#584235] uppercase tracking-wider">Tipe Kamar</label>
                            <select 
                                value={['Standard', 'Premium', 'Deluxe', ''].includes(rt.type || '') ? (rt.type || '') : '__custom__'}
                                onChange={e => {
                                    const val = e.target.value;
                                    const updatedRoomTypes = [...kmListingForm.roomTypes];
                                    if (val === '__custom__') {
                                        updatedRoomTypes[idx] = { ...rt, type: 'Kustom' };
                                    } else {
                                        updatedRoomTypes[idx] = { ...rt, type: val };
                                    }
                                    setKmListingForm({ ...kmListingForm, roomTypes: updatedRoomTypes });
                                }}
                                className="w-full h-[40px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white font-bold outline-none text-[#584235]"
                            >
                                <option value="" disabled hidden>Pilih Tipe Kamar</option>
                                <option value="Standard">Standard</option>
                                <option value="Premium">Premium</option>
                                <option value="Deluxe">Deluxe</option>
                                <option value="__custom__">Tipe Kustom...</option>
                            </select>
                            {!['Standard', 'Premium', 'Deluxe', ''].includes(rt.type || '') && (
                                <div className="mt-1.5">
                                    <input 
                                        type="text"
                                        value={rt.type === 'Kustom' ? '' : rt.type}
                                        onChange={e => {
                                            const updatedRoomTypes = [...kmListingForm.roomTypes];
                                            updatedRoomTypes[idx] = { ...rt, type: e.target.value };
                                            setKmListingForm({ ...kmListingForm, roomTypes: updatedRoomTypes });
                                        }}
                                        placeholder="Masukkan tipe kamar kustom..."
                                        className="w-full h-[40px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white font-bold outline-none text-[#584235]"
                                    />
                                </div>
                            )}
                        </div>
                        {/* Luas / Ukuran Kamar ([Panjang] X [Lebar] meter) */}
                        <div className={`md:col-span-2 flex flex-col gap-1.5 p-2 rounded-xl relative transition-all ${
                            roomEval.hasRevision && roomEval.roomSize
                                ? 'border-2 border-amber-400 ring-2 ring-amber-400/30 bg-amber-500/[0.04] animate-pulse'
                                : ''
                        }`}>
                            {roomEval.hasRevision && roomEval.roomSize && (
                                <span className="inline-flex items-center gap-1 text-[9px] font-black text-amber-700 uppercase tracking-wider">
                                    <Sparkles size={10} /> ⚠️ Perlu Revisi Ukuran
                                </span>
                            )}
                            <label className="text-[11px] font-bold text-[#584235] uppercase tracking-wider">Luas / Ukuran Kamar</label>
                            <div className="flex items-center gap-2">
                                {(() => {
                                    const { length: len, width: wid } = parseDimensionParts(rt.size || rt.dimensions || '');
                                    return (
                                        <>
                                            <input 
                                                type="text"
                                                value={len}
                                                onChange={e => {
                                                    const newLen = e.target.value;
                                                    const formatted = newLen || wid ? `${newLen}x${wid} meter` : '';
                                                    const updatedRoomTypes = [...kmListingForm.roomTypes];
                                                    updatedRoomTypes[idx] = { ...rt, size: formatted, dimensions: formatted };
                                                    setKmListingForm({ ...kmListingForm, roomTypes: updatedRoomTypes });
                                                }}
                                                className="w-24 h-[40px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white font-bold outline-none text-[#584235] text-center"
                                                placeholder=""
                                            />
                                            <span className="text-xs font-black text-[#584235] uppercase">X</span>
                                            <input 
                                                type="text"
                                                value={wid}
                                                onChange={e => {
                                                    const newWid = e.target.value;
                                                    const formatted = len || newWid ? `${len}x${newWid} meter` : '';
                                                    const updatedRoomTypes = [...kmListingForm.roomTypes];
                                                    updatedRoomTypes[idx] = { ...rt, size: formatted, dimensions: formatted };
                                                    setKmListingForm({ ...kmListingForm, roomTypes: updatedRoomTypes });
                                                }}
                                                className="w-24 h-[40px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white font-bold outline-none text-[#584235] text-center"
                                                placeholder=""
                                            />
                                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">meter</span>
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                        {/* Status Kamar */}
                        <div className={`md:col-span-2 flex flex-col gap-1.5 mt-2 border-t border-gray-100 pt-3 p-2 rounded-xl relative transition-all ${
                            roomEval.hasRevision && roomEval.occupants
                                ? 'border-2 border-amber-400 ring-2 ring-amber-400/30 bg-amber-500/[0.04] animate-pulse'
                                : ''
                        }`}>
                            {roomEval.hasRevision && roomEval.occupants && (
                                <span className="inline-flex items-center gap-1 text-[9px] font-black text-amber-700 uppercase tracking-wider">
                                    <Sparkles size={10} /> ⚠️ Perlu Revisi Status Penghuni
                                </span>
                            )}
                            <label className="text-[11px] font-bold text-[#584235] uppercase tracking-wider">Status Kamar</label>
                            <div className="flex gap-2">
                                <button 
                                    type="button"
                                    onClick={() => {
                                        updateRoomFacilitiesWithPhotos(rt.roomFacilities || [], 'Terisi');
                                    }}
                                    className={`flex-1 py-3 px-4 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all active:scale-95 text-center ${isOccupied ? 'bg-green-500 text-white border-green-500 shadow-sm' : 'border-gray-300 text-gray-600 bg-white hover:bg-gray-50'}`}
                                >
                                    Terisi
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => {
                                        updateRoomFacilitiesWithPhotos(rt.roomFacilities || [], 'Kosong');
                                    }}
                                    className={`flex-1 py-3 px-4 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all active:scale-95 text-center ${!isOccupied ? 'bg-[#ff7a00] text-white border-[#ff7a00] shadow-sm' : 'border-gray-300 text-gray-600 bg-white hover:bg-gray-50'}`}
                                >
                                    Kosong
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                                                     <div className={`rounded-xl p-4 flex flex-col gap-3.5 relative transition-all ${
                                                         roomEval.hasRevision && roomEval.pricing
                                                             ? 'border-2 border-amber-400 ring-4 ring-amber-400/30 shadow-[0_0_20px_rgba(245,158,11,0.2)] bg-gradient-to-br from-amber-500/[0.04] via-white to-orange-500/[0.02] animate-pulse'
                                                             : 'border border-gray-150 bg-gray-50/30'
                                                     }`}>
                                                         {roomEval.hasRevision && roomEval.pricing && (
                                                             <div className="absolute -top-3 right-4 z-10 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-[10px] uppercase tracking-wider shadow-md shadow-amber-500/30 animate-bounce">
                                                                 <Sparkles size={12} />
                                                                 <span>⚠️ Perlu Revisi: Tarif &amp; Harga</span>
                                                             </div>
                                                         )}
                                                         <div className="flex justify-between items-center border-b border-gray-100 pb-1">
                                                             <span className="text-[10px] font-bold text-[#584235] uppercase tracking-widest">Skema Tarif / Harga Kamar</span>
                                                             <button 
                                                                 type="button" 
                                                                 onClick={() => {
                                                                     const currentPricing = rt.pricing || [];
                                                                     const definedPeriods = currentPricing.map((p) => p.period);
                                                                     const nextPeriod = ['bulanan', 'tahunan', '6bulanan', '3bulanan', 'mingguan', 'harian'].find(p => !definedPeriods.includes(p)) || 'bulanan';
                                                                     const baseMonthlyPrice = Number(currentPricing.find((p) => p.period === 'bulanan')?.price) || Number(rt.price) || 0;
                                                                     let defaultPrice = 0;
                                                                     if (nextPeriod === 'tahunan') defaultPrice = baseMonthlyPrice * 12;
                                                                     else if (nextPeriod === '6bulanan') defaultPrice = baseMonthlyPrice * 6;
                                                                     else if (nextPeriod === '3bulanan') defaultPrice = baseMonthlyPrice * 3;
                                                                     else defaultPrice = baseMonthlyPrice;

                                                                     const updatedRoomTypes = [...kmListingForm.roomTypes];
                                                                     updatedRoomTypes[activeRoomIdx] = {
                                                                         ...rt,
                                                                         pricing: [...currentPricing, { period: nextPeriod, price: defaultPrice || '' }]
                                                                     };
                                                                     setKmListingForm({ ...kmListingForm, roomTypes: updatedRoomTypes });
                                                                 }}
                                                                 className="text-[10px] font-bold text-[#ff7a00] hover:underline flex items-center gap-1"
                                                             >
                                                                 <Plus className="w-3.5 h-3.5 inline shrink-0" /> Tambah Skema Harga
                                                             </button>
                                                         </div>
                                                         
                                                         <div className="space-y-3">
                                                             {(() => {
                                                                 const pricing = rt.pricing || [];
                                                                 const hasMonthly = pricing.some((p) => p.period === 'bulanan');
                                                                 if (!hasMonthly) {
                                                                     const monthlyPrice = rt.price || '';
                                                                     rt.pricing = [{ period: 'bulanan', price: monthlyPrice }, ...pricing];
                                                                 }
                                                                 return rt.pricing.map((scheme, pIdx) => (
                                                                     <div key={pIdx} className="flex gap-2 items-center">
                                                                         <select
                                                                             value={scheme.period}
                                                                             onChange={(e) => {
                                                                                 const updatedPricing = [...rt.pricing];
                                                                                 updatedPricing[pIdx] = { ...scheme, period: e.target.value };
                                                                                 const updatedRoomTypes = [...kmListingForm.roomTypes];
                                                                                 updatedRoomTypes[activeRoomIdx] = { ...rt, pricing: updatedPricing };
                                                                                 setKmListingForm({ ...kmListingForm, roomTypes: updatedRoomTypes });
                                                                             }}
                                                                             className="bg-white border border-[#e0c0af] rounded-lg px-2 py-2 text-xs font-bold outline-none text-[#584235]"
                                                                         >
                                                                             <option value="bulanan">Bulanan</option>
                                                                             <option value="3bulanan">3 Bulan</option>
                                                                             <option value="6bulanan">6 Bulan</option>
                                                                             <option value="tahunan">Tahunan</option>
                                                                             <option value="mingguan">Mingguan</option>
                                                                             <option value="harian">Harian</option>
                                                                         </select>
                                                                         <div className="relative flex-grow">
                                                                             <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-bold">Rp</span>
                                                                             <input
                                                                                 type="text"
                                                                                  value={formatThousand(scheme.price)}
                                                                                  onChange={(e) => {
                                                                                      const val = parseThousand(e.target.value);
                                                                                     const updatedPricing = [...rt.pricing];
                                                                                     updatedPricing[pIdx] = { ...scheme, price: val };
                                                                                     
                                                                                     let legacyPriceUpdate = {};
                                                                                     if (scheme.period === 'bulanan') {
                                                                                         legacyPriceUpdate = { price: val };
                                                                                     }
                                                                                     const updatedRoomTypes = [...kmListingForm.roomTypes];
                                                                                     updatedRoomTypes[activeRoomIdx] = { ...rt, ...legacyPriceUpdate, pricing: updatedPricing };
                                                                                     setKmListingForm({ ...kmListingForm, roomTypes: updatedRoomTypes });
                                                                                 }}
                                                                                 className="w-full h-[36px] pl-8 pr-3 border border-[#e0c0af] rounded-lg text-xs bg-white text-gray-700 outline-none font-bold"
                                                                                 placeholder="Harga"
                                                                             />
                                                                         </div>
                                                                         {scheme.period !== 'bulanan' && (
                                                                             <button 
                                                                                 type="button" 
                                                                                 onClick={() => {
                                                                                     const updatedPricing = rt.pricing.filter((_, idx) => idx !== pIdx);
                                                                                     const updatedRoomTypes = [...kmListingForm.roomTypes];
                                                                                     updatedRoomTypes[activeRoomIdx] = { ...rt, pricing: updatedPricing };
                                                                                     setKmListingForm({ ...kmListingForm, roomTypes: updatedRoomTypes });
                                                                                 }}
                                                                                 className="text-red-500 hover:text-red-700 p-1"
                                                                             >
                                                                                 <Trash2 className="w-4 h-4 shrink-0" />
                                                                             </button>
                                                                         )}
                                                                     </div>
                                                                 ));
                                                             })()}
                                                         </div>
                                                         <p className="text-[10px] text-gray-400 leading-normal italic">
                                                             * Jika tarif Tahunan tidak diisi, tarif tahunan akan dihitung 12x tarif Bulanan secara default.
                                                         </p>

                                                          {/* Kelengkapan Penghuni & Biaya Lain */}
                                                          <div className="border-t border-gray-150 pt-4 mt-4 space-y-4">
                                                              <div className="grid grid-cols-2 gap-4">
                                                                  <div className="flex flex-col gap-1.5">
                                                                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Maks. Penghuni per Kamar</label>
                                                                      <div className="flex items-center gap-2">
                                                                          <input 
                                                                              type="number"
                                                                              min="1"
                                                                              value={rt?.maxOccupants ?? ''}
                                                                              onChange={e => {
                                                                                  const updated = [...kmListingForm.roomTypes];
                                                                                  updated[activeRoomIdx] = { ...rt, maxOccupants: e.target.value === '' ? '' : (parseInt(e.target.value) || 1) };
                                                                                  setKmListingForm({ ...kmListingForm, roomTypes: updated });
                                                                              }}
                                                                              className="w-full h-[36px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white text-gray-700 outline-none font-bold"
                                                                          />
                                                                          <span className="text-[10px] text-gray-500 font-bold uppercase">Orang</span>
                                                                      </div>
                                                                  </div>
                                                                  
                                                                  <div className="flex flex-col gap-1.5">
                                                                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Biaya Tambahan Orang (Rp/Bulan)</label>
                                                                      <div className="relative">
                                                                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-bold">Rp</span>
                                                                          <input 
                                                                              type="text"
                                                                              value={formatThousand(rt?.extraOccupantFee || 0)}
                                                                              onChange={e => {
                                                                                  const val = parseThousand(e.target.value);
                                                                                  const updated = [...kmListingForm.roomTypes];
                                                                                  updated[activeRoomIdx] = { ...rt, extraOccupantFee: val };
                                                                                  setKmListingForm({ ...kmListingForm, roomTypes: updated });
                                                                              }}
                                                                              className="w-full h-[36px] pl-8 pr-3 border border-[#e0c0af] rounded-lg text-xs bg-white text-gray-700 outline-none font-bold"
                                                                              placeholder="0"
                                                                          />
                                                                      </div>
                                                                  </div>
                                                              </div>
                                                          </div>
                                                     </div>
                                                     <div className="border border-gray-150 rounded-xl p-4 flex flex-col gap-3.5 bg-gray-50/30">
                                                          <span className="text-[10px] font-bold text-[#584235] uppercase tracking-widest border-b border-gray-100 pb-1">Fasilitas Kamar</span>
                                                          <div className="grid grid-cols-2 gap-y-3.5 gap-x-2">
                                                              {(() => {
                                                                 const current = rt.roomFacilities || [];
                                                                 const isKosongan = current.includes('Kosongan (Tanpa Perabot)');
                                                                 return (
                                                                     <div className="col-span-2 flex bg-gray-100 p-1 rounded-xl gap-1 mb-2 border border-gray-200/80">
                                                                         <button
                                                                             type="button"
                                                                             onClick={() => {
                                                                                 const cleared = current.filter((f: string) => !['Kasur', 'Lemari', 'Meja Belajar', 'AC', 'Kipas Angin', 'Water Heater'].includes(f));
                                                                                 if (!cleared.includes('Kosongan (Tanpa Perabot)')) {
                                                                                     cleared.push('Kosongan (Tanpa Perabot)');
                                                                                 }
                                                                                 updateRoomFacilitiesWithPhotos(cleared);
                                                                             }}
                                                                             className={`flex-1 py-2 rounded-lg text-[10px] uppercase tracking-wider font-black transition-all flex items-center justify-center gap-1.5 ${isKosongan ? 'bg-[#ff7a00] text-white shadow-sm scale-[1.02]' : 'text-gray-500 hover:text-gray-700'}`}
                                                                         >
                                                                             <AlertCircle className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                                             Kosongan (Tanpa Perabot)
                                                                         </button>
                                                                         <button
                                                                             type="button"
                                                                             onClick={() => {
                                                                                 const cleared = current.filter((f: string) => f !== 'Kosongan (Tanpa Perabot)');
                                                                                 updateRoomFacilitiesWithPhotos(cleared);
                                                                             }}
                                                                             className={`flex-1 py-2 rounded-lg text-[10px] uppercase tracking-wider font-black transition-all flex items-center justify-center gap-1.5 ${!isKosongan ? 'bg-[#ff7a00] text-white shadow-sm scale-[1.02]' : 'text-gray-500 hover:text-gray-700'}`}
                                                                         >
                                                                             <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                                                             Furnished (Isian)
                                                                         </button>
                                                                     </div>
                                                                 );
                                                             })()}

                                                             {['Kasur', 'Lemari', 'Meja Belajar', 'AC', 'Kipas Angin', 'Water Heater', 'Jendela Luar', 'Kamar Mandi Dalam', 'Dapur Dalam'].map(fac => {
                                                              const isChecked = rt.roomFacilities?.includes(fac);
                                                              const isPerabot = ['Kasur', 'Lemari', 'Meja Belajar', 'AC', 'Kipas Angin', 'Water Heater'].includes(fac);
                                                              const isKosongan = rt.roomFacilities?.includes('Kosongan (Tanpa Perabot)');
                                                              const isDisabled = isPerabot && isKosongan;
                                                              return (
                                                                  <React.Fragment key={fac}>
                                                                      <label className={`flex items-center gap-2.5 cursor-pointer transition-all ${isDisabled ? 'opacity-40 pointer-events-none' : ''}`}>
                                                                          <input 
                                                                              type="checkbox"
                                                                              checked={isChecked && !isDisabled}
                                                                              disabled={isDisabled}
                                                                              onChange={() => {
                                                                                  const current = rt.roomFacilities || [];
                                                                                  const updated = current.includes(fac)
                                                                                      ? current.filter((f: string) => f !== fac)
                                                                                      : [...current, fac];
                                                                                  updateRoomFacilitiesWithPhotos(updated);
                                                                              }}
                                                                              className="rounded border-[#e0c0af] text-[#ff7a00] focus:ring-[#ff7a00] w-5 h-5"
                                                                          />
                                                                          <span className="text-xs text-gray-700 uppercase tracking-wider font-semibold">{fac}</span>
                                                                      </label>

                                                                      {/* Nested bathroom facilities if Kamar Mandi Dalam is checked */}
                                                                      {fac === 'Kamar Mandi Dalam' && isChecked && (
                                                                          <div className="col-span-2 pl-6 mt-1.5 border-l-2 border-[#ff7a00] flex flex-col gap-2 bg-orange-50/30 p-3 rounded-xl animate-fadeIn">
                                                                              <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider mb-0.5">Kelengkapan Kamar Mandi Dalam:</span>
                                                                              <div className="grid grid-cols-2 gap-2.5">
                                                                                  {['Kloset Duduk', 'Kloset Jongkok', 'Shower', 'Wastafel'].map(bfac => {
                                                                                      const isBChecked = rt.bathroomFacilities?.includes(bfac);
                                                                                      return (
                                                                                          <label key={bfac} className="flex items-center gap-2 cursor-pointer">
                                                                                              <input 
                                                                                                  type="checkbox"
                                                                                                  checked={isBChecked}
                                                                                                  onChange={() => {
                                                                                                      const current = rt.bathroomFacilities || [];
                                                                                                      const updated = current.includes(bfac)
                                                                                                          ? current.filter((f: string) => f !== bfac)
                                                                                                          : [...current, bfac];
                                                                                                      const updatedRoomTypes = [...kmListingForm.roomTypes];
                                                                                                      updatedRoomTypes[activeRoomIdx] = { ...rt, bathroomFacilities: updated };
                                                                                                      setKmListingForm({ ...kmListingForm, roomTypes: updatedRoomTypes });
                                                                                                  }}
                                                                                                  className="rounded border-[#e0c0af] text-[#ff7a00] focus:ring-[#ff7a00] w-4.5 h-4.5"
                                                                                              />
                                                                                              <span className="text-xs text-gray-600 uppercase tracking-wider font-bold">{bfac}</span>
                                                                                          </label>
                                                                                      );
                                                                                  })}

                                                                                  {/* Custom bathroom tags */}
                                                                                  {(() => {
                                                                                      const bCustoms = rt.bathroomFacilities?.filter((f: string) => !['Kloset Duduk', 'Kloset Jongkok', 'Shower', 'Wastafel'].includes(f)) || [];
                                                                                      if (bCustoms.length === 0) return null;
                                                                                      return (
                                                                                          <div className="col-span-2 flex flex-wrap gap-1 mt-1 border-t border-orange-100 pt-2">
                                                                                              {bCustoms.map((fac) => (
                                                                                                  <span key={fac} className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-[#ff7a00] text-[9px] font-black rounded uppercase tracking-wider">
                                                                                                      {fac}
                                                                                                      <button 
                                                                                                          type="button" 
                                                                                                          onClick={() => {
                                                                                                              const current = rt.bathroomFacilities || [];
                                                                                                              const updatedRoomTypes = [...kmListingForm.roomTypes];
                                                                                                              updatedRoomTypes[activeRoomIdx] = { ...rt, bathroomFacilities: current.filter((f) => f !== fac) };
                                                                                                              setKmListingForm({ ...kmListingForm, roomTypes: updatedRoomTypes });
                                                                                                          }}
                                                                                                          className="hover:text-orange-700 text-xs font-bold leading-none p-0.5"
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
                                                                                          value={customBathroomFacilityInput} 
                                                                                          onChange={e => setCustomBathroomFacilityInput(e.target.value)} 
                                                                                          placeholder="Tambah kelengkapan WC..." 
                                                                                          className="flex-grow h-[28px] px-2 border border-[#e0c0af] rounded text-[11px] bg-white outline-none text-[#584235] font-bold"
                                                                                      />
                                                                                      <button 
                                                                                          type="button" 
                                                                                          onClick={() => {
                                                                                              if (!customBathroomFacilityInput.trim()) return;
                                                                                              const current = rt.bathroomFacilities || [];
                                                                                              if (!current.includes(customBathroomFacilityInput.trim())) {
                                                                                                  const updatedRoomTypes = [...kmListingForm.roomTypes];
                                                                                                  updatedRoomTypes[activeRoomIdx] = { ...rt, bathroomFacilities: [...current, customBathroomFacilityInput.trim()] };
                                                                                                  setKmListingForm({ ...kmListingForm, roomTypes: updatedRoomTypes });
                                                                                              }
                                                                                              setCustomBathroomFacilityInput('');
                                                                                          }}
                                                                                          className="h-[28px] px-3 bg-[#ff7a00] hover:bg-orange-600 text-white font-bold text-[10px] uppercase rounded flex items-center justify-center transition-colors shadow-sm"
                                                                                      >
                                                                                          +
                                                                                      </button>
                                                                                  </div>
                                                                              </div>
                                                                          </div>
                                                                      )}

                                                                      {/* Nested kitchen facilities if Dapur Dalam is checked */}
                                                                      {fac === 'Dapur Dalam' && isChecked && (
                                                                          <div className="col-span-2 pl-6 mt-1.5 border-l-2 border-[#ff7a00] flex flex-col gap-2 bg-orange-50/30 p-3 rounded-xl w-full animate-fadeIn">
                                                                              <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider mb-0.5">Kelengkapan Dapur Dalam:</span>
                                                                              <div className="grid grid-cols-2 gap-2.5">
                                                                                  {['Kompor', 'Kulkas', 'Wastafel Cuci Piring', 'Kitchen Set', 'Dispenser'].map(kfac => {
                                                                                      const isKChecked = rt.kitchenFacilities?.includes(kfac);
                                                                                      return (
                                                                                          <label key={kfac} className="flex items-center gap-2 cursor-pointer">
                                                                                              <input 
                                                                                                  type="checkbox" 
                                                                                                  checked={!!isKChecked}
                                                                                                  onChange={() => {
                                                                                                      const current = rt.kitchenFacilities || [];
                                                                                                      const updated = current.includes(kfac)
                                                                                                          ? current.filter((f: string) => f !== kfac)
                                                                                                          : [...current, kfac];
                                                                                                      const updatedRoomTypes = [...kmListingForm.roomTypes];
                                                                                                      updatedRoomTypes[activeRoomIdx] = { ...rt, kitchenFacilities: updated };
                                                                                                      setKmListingForm({ ...kmListingForm, roomTypes: updatedRoomTypes });
                                                                                                  }}
                                                                                                  className="rounded border-[#e0c0af] text-[#ff7a00] focus:ring-[#ff7a00] w-4.5 h-4.5"
                                                                                              />
                                                                                              <span className="text-[11px] text-gray-650 font-bold uppercase">{kfac}</span>
                                                                                          </label>
                                                                                      );
                                                                                  })}
                                                                              </div>
                                                                              
                                                                              {/* Custom kitchen tags */}
                                                                              {rt.kitchenFacilities?.filter((f: string) => !['Kompor', 'Kulkas', 'Wastafel Cuci Piring', 'Kitchen Set', 'Dispenser'].includes(f)).length > 0 && (
                                                                                  <div className="flex flex-wrap gap-1.5 mt-1 border-t border-orange-100 pt-2">
                                                                                      {rt.kitchenFacilities.filter((f: string) => !['Kompor', 'Kulkas', 'Wastafel Cuci Piring', 'Kitchen Set', 'Dispenser'].includes(f)).map((fac: string) => (
                                                                                          <span key={fac} className="bg-orange-100 text-[#ff7a00] px-2 py-0.5 rounded-full text-[9px] font-black uppercase flex items-center gap-1">
                                                                                              {fac}
                                                                                              <button
                                                                                                  type="button"
                                                                                                  onClick={() => {
                                                                                                      const current = rt.kitchenFacilities || [];
                                                                                                      const updatedRoomTypes = [...kmListingForm.roomTypes];
                                                                                                      updatedRoomTypes[activeRoomIdx] = { ...rt, kitchenFacilities: current.filter((f) => f !== fac) };
                                                                                                      setKmListingForm({ ...kmListingForm, roomTypes: updatedRoomTypes });
                                                                                                  }}
                                                                                                  className="text-red-600 hover:text-red-850 font-bold text-xs"
                                                                                              >
                                                                                                  &times;
                                                                                              </button>
                                                                                          </span>
                                                                                      ))}
                                                                                  </div>
                                                                              )}
                                                                              
                                                                              {/* Custom kitchen facility input adder */}
                                                                              <div className="flex gap-2 mt-1.5 border-t border-orange-100 pt-2">
                                                                                  <input 
                                                                                      type="text" 
                                                                                      placeholder="Tambah kelengkapan dapur..." 
                                                                                      value={customKitchenFacilityInput} 
                                                                                      onChange={e => setCustomKitchenFacilityInput(e.target.value)} 
                                                                                      className="flex-grow h-[28px] px-2 border border-[#e0c0af] rounded text-[11px] bg-white outline-none text-[#584235] font-bold"
                                                                                  />
                                                                                  <button 
                                                                                      type="button" 
                                                                                      onClick={() => {
                                                                                          if (!customKitchenFacilityInput.trim()) return;
                                                                                          const current = rt.kitchenFacilities || [];
                                                                                          const updatedRoomTypes = [...kmListingForm.roomTypes];
                                                                                          updatedRoomTypes[activeRoomIdx] = { ...rt, kitchenFacilities: [...current, customKitchenFacilityInput.trim()] };
                                                                                          setKmListingForm({ ...kmListingForm, roomTypes: updatedRoomTypes });
                                                                                          setCustomKitchenFacilityInput('');
                                                                                      }}
                                                                                      className="h-[28px] px-3 bg-[#ff7a00] hover:bg-orange-600 text-white font-bold text-[10px] uppercase rounded flex items-center justify-center transition-colors shadow-sm"
                                                                                  >
                                                                                      +
                                                                                  </button>
                                                                              </div>
                                                                          </div>
                                                                      )}
                                                                  </React.Fragment>
                                                              );
                                                          })}
                                                    </div>

                                                    {/* Removable Custom Badges */}
                                                         {(() => {
                                                             const customs = rt.roomFacilities?.filter((f) => !['Kasur', 'Lemari', 'Meja Belajar', 'AC', 'Kipas Angin', 'Kamar Mandi Dalam', 'Water Heater', 'Jendela Luar', 'Dapur Dalam'].includes(f)) || [];
                                                             if (customs.length === 0) return null;
                                                             return (
                                                                 <div className="flex flex-wrap gap-1.5 mt-1 border-t border-gray-100 pt-3">
                                                                     {customs.map((fac) => (
                                                                         <span key={fac} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-orange-50 text-[#ff7a00] text-[10px] font-black rounded-lg border border-orange-100 uppercase tracking-wider">
                                                                             {fac}
                                                                             <button 
                                                                                 type="button" 
                                                                                 onClick={() => {
                                                                                     const current = rt.roomFacilities || [];
                                                                                     updateRoomFacilitiesWithPhotos(current.filter((f) => f !== fac));
                                                                                 }}
                                                                                 className="hover:text-orange-700 text-xs font-bold leading-none p-0.5"
                                                                             >
                                                                                 &times;
                                                                             </button>
                                                                         </span>
                                                                     ))}
                                                                 </div>
                                                             );
                                                         })()}

                                                         {/* Custom Facility Adder Input */}
                                                         <div className="flex gap-2 mt-1 border-t border-gray-100 pt-3">
                                                             <input 
                                                                 type="text" 
                                                                 value={customRoomFacilityInput} 
                                                                 onChange={e => setCustomRoomFacilityInput(e.target.value)} 
                                                                 placeholder="Tambah fasilitas kustom..." 
                                                                 className="flex-grow h-[36px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white outline-none text-[#584235] font-bold"
                                                             />
                                                              <button 
                                                                  type="button"
                                                                  onClick={() => {
                                                                      if (!customRoomFacilityInput.trim()) return;
                                                                      const current = rt.roomFacilities || [];
                                                                      if (!current.includes(customRoomFacilityInput.trim())) {
                                                                          updateRoomFacilitiesWithPhotos([...current, customRoomFacilityInput.trim()]);
                                                                      }
                                                                      setCustomRoomFacilityInput('');
                                                                  }}
                                                                  className="h-[36px] px-4 bg-[#ff7a00] hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center transition-colors shadow-sm"
                                                              >
                                                                  Tambah
                                                              </button>
                                                          </div>
                                                       </div>

                                                           {/* Biaya Tambahan Bulanan Lainnya */}
                                                           <div className="border border-gray-150 rounded-xl p-4 flex flex-col gap-3.5 bg-gray-50/30">
                                                               <span className="text-[10px] font-bold text-[#584235] uppercase tracking-widest border-b border-gray-100 pb-1">Biaya Tambahan Bulanan Lainnya</span>
                                                               
                                                               <div className="flex flex-col gap-1.5">
                                                                   <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Nominal Biaya Tambahan Bulanan (Rp/Bulan)</label>
                                                                   <div className="relative">
                                                                       <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-bold">Rp</span>
                                                                       <input 
                                                                           type="text" 
                                                                           value={formatThousand(rt?.otherFeeAmount || 0)}
                                                                           onChange={e => {
                                                                               const val = parseThousand(e.target.value);
                                                                               const updated = [...kmListingForm.roomTypes];
                                                                               updated[activeRoomIdx] = { ...rt, otherFeeAmount: val };
                                                                               setKmListingForm({ ...kmListingForm, roomTypes: updated });
                                                                           }}
                                                                           className="w-full h-[36px] pl-8 pr-3 border border-[#e0c0af] rounded-lg text-xs bg-white text-gray-700 outline-none font-bold"
                                                                           placeholder="0"
                                                                       />
                                                                   </div>
                                                               </div>

                                                               <div className="flex flex-col gap-1.5 mt-1">
                                                                   <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Cakupan Biaya Tambahan</label>
                                                                   <div className="grid grid-cols-2 gap-2">
                                                                       {['Listrik', 'Air', 'Sampah', 'Wifi', 'Keamanan/Parkir'].map(feeName => {
                                                                           const isChecked = rt?.otherFeeCoveredItems?.includes(feeName);
                                                                           return (
                                                                               <label key={feeName} className="flex items-center gap-2 cursor-pointer p-2.5 bg-white border border-[#e0c0af] rounded-lg shadow-sm">
                                                                                   <input 
                                                                                       type="checkbox"
                                                                                       checked={!!isChecked}
                                                                                       onChange={() => {
                                                                                           const current = rt?.otherFeeCoveredItems || [];
                                                                                           const updated = current.includes(feeName)
                                                                                               ? current.filter(item => item !== feeName)
                                                                                               : [...current, feeName];
                                                                                           const updatedRooms = [...kmListingForm.roomTypes];
                                                                                           updatedRooms[activeRoomIdx] = { ...rt, otherFeeCoveredItems: updated };
                                                                                           setKmListingForm({ ...kmListingForm, roomTypes: updatedRooms });
                                                                                       }}
                                                                                       className="rounded border-[#e0c0af] text-[#ff7a00] focus:ring-[#ff7a00] w-4.5 h-4.5"
                                                                                   />
                                                                                   <span className="text-[10px] font-bold text-gray-655 uppercase tracking-wider">{feeName}</span>
                                                                               </label>
                                                                           );
                                                                       })}
                                                                   </div>
                                                               </div>
                                                       </div>

                                                                    {/* Dokumentasi Foto Kamar */}
                                                                    <div className={`rounded-xl p-4 flex flex-col gap-3.5 relative transition-all ${
                                                                        roomEval.hasRevision && roomEval.roomPhotos
                                                                            ? 'border-2 border-amber-400 ring-4 ring-amber-400/30 shadow-[0_0_20px_rgba(245,158,11,0.2)] bg-gradient-to-br from-amber-500/[0.04] via-white to-orange-500/[0.02] animate-pulse'
                                                                            : 'border border-gray-150 bg-gray-50/30'
                                                                    }`}>
                                                                        {roomEval.hasRevision && roomEval.roomPhotos && (
                                                                            <div className="absolute -top-3 right-4 z-10 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-[10px] uppercase tracking-wider shadow-md shadow-amber-500/30 animate-bounce">
                                                                                <Sparkles size={12} />
                                                                                <span>⚠️ Perlu Revisi: Foto Kamar</span>
                                                                            </div>
                                                                        )}
                                                                        <div className="flex justify-between items-center border-b border-gray-100 pb-1.5">
                                                                            <span className="text-[10px] font-bold text-[#584235] uppercase tracking-widest">Dokumentasi Foto Kamar</span>
                                                                        </div>
                                                                        {(() => {
                                                                            const standardKnown = ['Interior Kamar *Wajib', 'Interior Kamar (Opsional)', 'Kamar Mandi', 'Dapur Dalam', 'Tempat Tidur', 'Lemari / Storage', 'Meja Belajar', 'AC', 'Kipas Angin', 'Jendela Luar', 'Water Heater'];
                                                                            const currentCategorized = getRoomCategorizedPhotos(rt);
                                                                            const existingCustomKeys = Object.keys(currentCategorized).filter((c: string) => !standardKnown.includes(c));
                                                                            const activeCats = computeDynamicRoomPhotoCategories(rt.roomFacilities || [], rt.status, existingCustomKeys);

                                                                            const getPhotoCaption = (cLabel: string, pIdx: number) => {
                                                                                const clean = cLabel.replace(/(\*Wajib|\(Opsional\))/gi, '').trim();
                                                                                return `${clean} ${pIdx + 1}`;
                                                                            };

                                                                            return (
                                                                                <div className="space-y-3">
                                                                                    {activeCats.map((rawLabel: string) => {
                                                                                        const label = (rawLabel === 'Interior Kamar *Wajib' && rt.status === 'Terisi') ? 'Interior Kamar (Opsional)' : rawLabel;
                                                                                        const catPhotos = currentCategorized[rawLabel] 
                                                                                            || (rawLabel.includes('Interior') ? (currentCategorized['Interior Kamar *Wajib'] || currentCategorized['Interior Kamar (Opsional)'] || []) : []) 
                                                                                            || [];

                                                                                        return (
                                                                                            <div key={rawLabel} className="bg-white border border-[#e0c0af]/60 rounded-xl p-3 shadow-xs space-y-2.5">
                                                                                                <div className="flex justify-between items-center">
                                                                                                    <div className="flex items-center gap-1.5">
                                                                                                        {rawLabel.includes('Interior') ? <Home className="w-3.5 h-3.5 text-[#ff7a00] shrink-0" /> :
                                                                                                          rawLabel.includes('Mandi') ? <Bath className="w-3.5 h-3.5 text-[#ff7a00] shrink-0" /> :
                                                                                                          rawLabel.includes('Tidur') ? <Bed className="w-3.5 h-3.5 text-[#ff7a00] shrink-0" /> :
                                                                                                          rawLabel.includes('AC') ? <Fan className="w-3.5 h-3.5 text-[#ff7a00] shrink-0" /> :
                                                                                                          <Camera className="w-3.5 h-3.5 text-[#ff7a00] shrink-0" />}
                                                                                                        <span className="text-[11px] font-bold text-[#584235] uppercase tracking-wider">{label}</span>
                                                                                                    </div>
                                                                                                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${catPhotos.length > 0 ? 'bg-orange-100 text-[#ff7a00]' : 'bg-gray-100 text-gray-500'}`}>
                                                                                                        {catPhotos.length} Foto
                                                                                                    </span>
                                                                                                </div>

                                                                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                                                                    {catPhotos.map((url, pIdx) => (
                                                                                                        <div key={`${url}_${pIdx}`} className="aspect-video w-full rounded-lg overflow-hidden border border-gray-200 relative group bg-gray-50">
                                                                                                            <img src={url} alt={getPhotoCaption(label, pIdx)} className="w-full h-full object-cover" />
                                                                                                            <button
                                                                                                                type="button"
                                                                                                                onClick={() => {
                                                                                                                    const updatedCategorized = { ...currentCategorized };
                                                                                                                    const targetKey = Object.keys(updatedCategorized).find(k => k === rawLabel || (rawLabel.includes('Interior') && k.includes('Interior'))) || rawLabel;
                                                                                                                    const list = [...(updatedCategorized[targetKey] || [])];
                                                                                                                    list.splice(pIdx, 1);
                                                                                                                    if (list.length > 0) {
                                                                                                                        updatedCategorized[targetKey] = list;
                                                                                                                    } else {
                                                                                                                        delete updatedCategorized[targetKey];
                                                                                                                    }
                                                                                                                    const { images, photoCategories } = exportCategorizedPhotos(updatedCategorized);
                                                                                                                    const updatedRoomTypes = [...kmListingForm.roomTypes];
                                                                                                                    updatedRoomTypes[activeRoomIdx] = { 
                                                                                                                        ...rt, 
                                                                                                                        categorized_photos: updatedCategorized,
                                                                                                                        categorizedPhotos: updatedCategorized,
                                                                                                                        images,
                                                                                                                        photoCategories
                                                                                                                    };
                                                                                                                    setKmListingForm({ ...kmListingForm, roomTypes: updatedRoomTypes });
                                                                                                                }}
                                                                                                                className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow-md transition-all active:scale-90"
                                                                                                                title="Hapus foto ini"
                                                                                                            >
                                                                                                                &times;
                                                                                                            </button>
                                                                                                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 py-0.5 px-1 text-[8px] text-white text-center uppercase font-bold tracking-wider truncate">
                                                                                                                {getPhotoCaption(label, pIdx)}
                                                                                                            </div>
                                                                                                        </div>
                                                                                                    ))}

                                                                                                    <div 
                                                                                                        onClick={async () => {
                                                                                                            const input = document.createElement('input');
                                                                                                            input.type = 'file';
                                                                                                            input.accept = 'image/*';
                                                                                                            input.multiple = true;
                                                                                                            input.onchange = async (e: any) => {
                                                                                                                const files = e.target?.files;
                                                                                                                if (files && files.length > 0) {
                                                                                                                    const uploadKey = `room_${activeRoomIdx}_${rawLabel}`;
                                                                                                                    setUploadingRooms(prev => ({ ...prev, [uploadKey]: true }));
                                                                                                                    try {
                                                                                                                        const newUrls = [];
                                                                                                                        for (let f = 0; f < files.length; f++) {
                                                                                                                            const folder = `kostmanager/rooms/${Date.now()}_${f}`;
                                                                                                                            const publicUrl = await uploadFileAndGetURL(files[f], folder);
                                                                                                                            newUrls.push(publicUrl);
                                                                                                                        }
                                                                                                                        const updatedCategorized = { ...currentCategorized };
                                                                                                                        const targetKey = rawLabel.includes('Interior') ? (rt.status === 'Terisi' ? 'Interior Kamar (Opsional)' : 'Interior Kamar *Wajib') : rawLabel;
                                                                                                                        const list = [...(updatedCategorized[targetKey] || [])];
                                                                                                                        newUrls.forEach(u => list.push(u));
                                                                                                                        updatedCategorized[targetKey] = list;
                                                                                                                        const { images, photoCategories } = exportCategorizedPhotos(updatedCategorized);
                                                                                                                        const updatedRoomTypes = [...kmListingForm.roomTypes];
                                                                                                                        updatedRoomTypes[activeRoomIdx] = { 
                                                                                                                            ...rt, 
                                                                                                                            categorized_photos: updatedCategorized,
                                                                                                                            categorizedPhotos: updatedCategorized,
                                                                                                                            images,
                                                                                                                            photoCategories
                                                                                                                        };
                                                                                                                        const updatedForm = { ...kmListingForm, roomTypes: updatedRoomTypes };
                                                                                                                        setKmListingForm(updatedForm);
                                                                                                                        saveKostManagerDraftToDatabase(updatedForm, kmStep, photoCategories);
                                                                                                                    } catch (err) {
                                                                                                                        alert('Gagal unggah foto: ' + (err as Error).message);
                                                                                                                    } finally {
                                                                                                                        setUploadingRooms(prev => ({ ...prev, [uploadKey]: false }));
                                                                                                                    }
                                                                                                                }
                                                                                                            };
                                                                                                            input.click();
                                                                                                        }}
                                                                                                        className={`aspect-video bg-white border-2 border-dashed border-[#ff7a00] rounded-lg flex flex-col items-center justify-center p-2 cursor-pointer hover:bg-orange-50/50 transition-all text-[#584235] ${catPhotos.length === 0 ? 'col-span-2 sm:col-span-3 py-4' : ''}`}
                                                                                                    >
                                                                                                        {uploadingRooms[`room_${activeRoomIdx}_${rawLabel}`] ? (
                                                                                                            <span className="text-[10px] font-bold animate-pulse text-gray-500">Uploading...</span>
                                                                                                        ) : (
                                                                                                            <>
                                                                                                                <ImagePlus className="w-5 h-5 text-[#ff7a00] shrink-0" />
                                                                                                                <span className="text-[9px] font-bold uppercase tracking-wider mt-0.5 text-center">
                                                                                                                    {catPhotos.length === 0 ? `+ Unggah Foto ${label.replace(/(\*Wajib|\(Opsional\))/gi, '').trim()}` : '+ Tambah Foto'}
                                                                                                                </span>
                                                                                                            </>
                                                                                                        )}
                                                                                                    </div>
                                                                                                </div>
                                                                                            </div>
                                                                                        );
                                                                                    })}
                                                                                </div>
                                                                            );
                                                                        })()}
                                                                       {/* Input Kategori Tambahan Kamar */}
                                                                       <div className="flex gap-2 mt-2">
                                                                           <input 
                                                                               type="text" 
                                                                               placeholder="Kategori Foto Kamar Baru (misal: Balkon Kamar)" 
                                                                               value={newRoomPhotoCategoryName} 
                                                                               onChange={e => setNewRoomPhotoCategoryName(e.target.value)} 
                                                                               className="flex-1 h-[36px] px-3 border border-gray-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-orange-500 bg-white"
                                                                           />
                                                                           <button
                                                                               type="button"
                                                                               onClick={() => {
                                                                                   if (!newRoomPhotoCategoryName.trim()) return;
                                                                                   const cat = newRoomPhotoCategoryName.trim();
                                                                                   const updatedCategorized = getRoomCategorizedPhotos(rt);
                                                                                   if (!updatedCategorized[cat]) {
                                                                                       updatedCategorized[cat] = [];
                                                                                   }
                                                                                   const { images, photoCategories } = exportCategorizedPhotos(updatedCategorized);
                                                                                   const updatedRoomTypes = [...kmListingForm.roomTypes];
                                                                                   updatedRoomTypes[activeRoomIdx] = {
                                                                                       ...rt,
                                                                                       categorized_photos: updatedCategorized,
                                                                                       categorizedPhotos: updatedCategorized,
                                                                                       images,
                                                                                       photoCategories
                                                                                   };
                                                                                   setKmListingForm({ ...kmListingForm, roomTypes: updatedRoomTypes });
                                                                                   setNewRoomPhotoCategoryName('');
                                                                               }}
                                                                               className="bg-[#eff4ff] hover:bg-[#dce9ff] text-[#ff7a00] font-bold text-xs uppercase px-4 rounded-lg border border-[#e0c0af] transition-colors"
                                                                           >
                                                                               + Kategori Kamar
                                                                           </button>
                                                                       </div>
                                                                   </div>
                                                       {rt.status === 'Terisi' && (
                                                          <>
                                                                 <div className="border border-gray-150 rounded-xl p-4 flex flex-col gap-3.5 bg-gray-50/30">
                                                                     <span className="text-[10px] font-bold text-[#584235] uppercase tracking-widest border-b border-gray-100 pb-1">Informasi Penghuni</span>
                                                                     <div className="flex flex-col gap-3">
                                                                         <div className="flex flex-col gap-1">
                                                                             <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Nama Penghuni</label>
                                                                             <input 
                                                                                 type="text"
                                                                                 value={rt.residentName || ''}
                                                                                 onChange={e => {
                                                                                     const updated = [...kmListingForm.roomTypes];
                                                                                     updated[activeRoomIdx] = { ...rt, residentName: e.target.value };
                                                                                     setKmListingForm({ ...kmListingForm, roomTypes: updated });
                                                                                 }}
                                                                                 className="w-full h-[40px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white text-gray-700 outline-none font-bold"
                                                                                 placeholder="Nama Lengkap Penghuni"
                                                                             />
                                                                         </div>
                                                                         <div className="flex flex-col gap-1">
                                                                             <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Nomor HP / WhatsApp</label>
                                                                             <input 
                                                                                 type="text"
                                                                                 value={rt.residentPhone || ''}
                                                                                 onChange={e => {
                                                                                     const updated = [...kmListingForm.roomTypes];
                                                                                     updated[activeRoomIdx] = { ...rt, residentPhone: e.target.value };
                                                                                     setKmListingForm({ ...kmListingForm, roomTypes: updated });
                                                                                 }}
                                                                                 className="w-full h-[40px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white text-gray-700 outline-none"
                                                                                 placeholder="contoh: 08123456789"
                                                                             />
                                                                         </div>
                                                                           <div className="flex flex-col gap-1">
                                                                               <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Jenis Langganan</label>
                                                                               {(() => {
                                                                                   const { amount, unit } = parsePaymentPeriod(rt.paymentPeriod || 'bulanan');
                                                                                   return (
                                                                                       <div className="flex gap-2">
                                                                                           <input 
                                                                                               type="number"
                                                                                               min="1"
                                                                                               value={amount}
                                                                                               onChange={e => {
                                                                                                   const val = parseInt(e.target.value) || 1;
                                                                                                   const updated = [...kmListingForm.roomTypes];
                                                                                                   updated[activeRoomIdx] = { ...rt, paymentPeriod: `${val} ${unit}` };
                                                                                                   setKmListingForm({ ...kmListingForm, roomTypes: updated });
                                                                                               }}
                                                                                               className="w-20 h-[40px] px-2.5 border border-[#e0c0af] rounded-lg text-xs bg-white text-gray-700 outline-none font-bold"
                                                                                           />
                                                                                           <select 
                                                                                               value={unit}
                                                                                               onChange={e => {
                                                                                                   const updated = [...kmListingForm.roomTypes];
                                                                                                   updated[activeRoomIdx] = { ...rt, paymentPeriod: `${amount} ${e.target.value}` };
                                                                                                   setKmListingForm({ ...kmListingForm, roomTypes: updated });
                                                                                               }}
                                                                                               className="flex-grow h-[40px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white text-gray-700 outline-none font-bold"
                                                                                           >
                                                                                               <option value="hari">Hari</option>
                                                                                               <option value="minggu">Minggu</option>
                                                                                               <option value="bulan">Bulan</option>
                                                                                               <option value="tahun">Tahun</option>
                                                                                           </select>
                                                                                       </div>
                                                                                   );
                                                                               })()}
                                                                           </div>
                                                                          <div className="grid grid-cols-2 gap-2">
                                                                              <div className="flex flex-col gap-1">
                                                                                  <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider font-semibold">Tanggal Pembayaran Terakhir</label>
                                                                                  <input 
                                                                                      type="date"
                                                                                      value={rt.startDate || ''}
                                                                                      onChange={e => {
                                                                                          const updated = [...kmListingForm.roomTypes];
                                                                                          updated[activeRoomIdx] = { ...rt, startDate: e.target.value };
                                                                                          setKmListingForm({ ...kmListingForm, roomTypes: updated });
                                                                                      }}
                                                                                      className="w-full h-[40px] px-2 border border-[#e0c0af] rounded-lg text-xs bg-white text-gray-700 outline-none font-bold"
                                                                                  />
                                                                              </div>
                                                                              <div className="flex flex-col gap-1">
                                                                                  <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider font-semibold">Tagihan Berikutnya</label>
                                                                                  <input 
                                                                                      type="date"
                                                                                      value={rt.endDate || ''}
                                                                                      onChange={e => {
                                                                                          const updated = [...kmListingForm.roomTypes];
                                                                                          updated[activeRoomIdx] = { ...rt, endDate: e.target.value };
                                                                                          setKmListingForm({ ...kmListingForm, roomTypes: updated });
                                                                                      }}
                                                                                      className="w-full h-[40px] px-2 border border-[#e0c0af] rounded-lg text-xs bg-white text-gray-700 outline-none font-bold"
                                                                                  />
                                                                              </div>
                                                                          </div>

                                                                           <div className="flex flex-col gap-1">
                                                                               <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Jumlah Penghuni Saat Ini</label>
                                                                               <div className="flex items-center gap-2">
                                                                                   <input 
                                                                                       type="number"
                                                                                       min="1"
                                                                                       value={rt.currentOccupants ?? 1}
                                                                                       onChange={e => {
                                                                                           const val = e.target.value === '' ? '' : (parseInt(e.target.value) || 1);
                                                                                           const updated = [...kmListingForm.roomTypes];
                                                                                           updated[activeRoomIdx] = { ...rt, currentOccupants: val };
                                                                                           setKmListingForm({ ...kmListingForm, roomTypes: updated });
                                                                                       }}
                                                                                       className="w-full h-[40px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white text-gray-700 outline-none font-bold"
                                                                                       placeholder="Jumlah penghuni saat ini"
                                                                                   />
                                                                                   <span className="text-xs font-bold text-gray-500 uppercase">Orang</span>
                                                                               </div>
                                                                           </div>

                                                                          {/* Additional occupants sub-inputs if currentOccupants > 1 */}
                                                                          {Array.from({ length: Math.max(0, (rt.currentOccupants || 1) - 1) }).map((_, idx) => {
                                                                              const occupant = (rt.additionalOccupants || [])[idx] || { name: '', phone: '' };
                                                                              return (
                                                                                  <div key={idx} className="col-span-2 pl-4 mt-2 border-l-2 border-[#ff7a00] flex flex-col gap-2 bg-[#fffaf5] p-3 rounded-lg w-full">
                                                                                      <span className="text-[10px] font-black text-[#ff7a00] uppercase tracking-wider">Anggota Penghuni {idx + 2}</span>
                                                                                      <div className="grid grid-cols-2 gap-2.5">
                                                                                          <div className="flex flex-col gap-1">
                                                                                              <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Nama Lengkap</label>
                                                                                              <input 
                                                                                                  type="text"
                                                                                                  value={occupant.name || ''}
                                                                                                  onChange={e => {
                                                                                                      const updatedList = [...(rt.additionalOccupants || [])];
                                                                                                      while (updatedList.length <= idx) updatedList.push({ name: '', phone: '' });
                                                                                                      updatedList[idx] = { ...updatedList[idx], name: e.target.value };
                                                                                                      const updated = [...kmListingForm.roomTypes];
                                                                                                      updated[activeRoomIdx] = { ...rt, additionalOccupants: updatedList };
                                                                                                      setKmListingForm({ ...kmListingForm, roomTypes: updated });
                                                                                                  }}
                                                                                                  className="w-full h-[36px] px-2.5 border border-[#e0c0af] rounded-lg text-xs bg-white text-gray-750 outline-none font-bold"
                                                                                                  placeholder="Nama Lengkap"
                                                                                              />
                                                                                          </div>
                                                                                          <div className="flex flex-col gap-1">
                                                                                              <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">No. WhatsApp</label>
                                                                                              <input 
                                                                                                  type="text"
                                                                                                  value={occupant.phone || ''}
                                                                                                  onChange={e => {
                                                                                                      const updatedList = [...(rt.additionalOccupants || [])];
                                                                                                      while (updatedList.length <= idx) updatedList.push({ name: '', phone: '' });
                                                                                                      updatedList[idx] = { ...updatedList[idx], phone: e.target.value };
                                                                                                      const updated = [...kmListingForm.roomTypes];
                                                                                                      updated[activeRoomIdx] = { ...rt, additionalOccupants: updatedList };
                                                                                                      setKmListingForm({ ...kmListingForm, roomTypes: updated });
                                                                                                  }}
                                                                                                  className="w-full h-[36px] px-2.5 border border-[#e0c0af] rounded-lg text-xs bg-white text-gray-750 outline-none"
                                                                                                  placeholder="08xxxxxxxx"
                                                                                              />
                                                                                          </div>
                                                                                      </div>
                                                                                  </div>
                                                                              );
                                                                          })}

                                                                     </div>
                                                                 </div>
                                                              </>
                                                          )}
                                                          
                                                         {/* Selesai & Simpan Kamar Button */}
                                                         <button 
                                                             type="button"
                                                             onClick={() => {
                                                                 setActiveRoomIdx(null);
                                                                 alert('Perubahan kamar berhasil disimpan!');
                                                             }}
                                                             className="w-full h-[40px] bg-[#eff4ff] hover:bg-[#dce9ff] text-[#264191] font-bold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center transition-colors border border-[#d3e4fe] shadow-sm mt-2"
                                                         >
                                                             Selesai & Simpan Kamar
                                                         </button>
            </div>
        );
    };
    const TaskCardSkeleton = () => (
        <div className="bg-surface-container-lowest p-stack-md rounded-2xl shadow-soft-float border border-surface-container mb-stack-lg relative overflow-hidden flex flex-col gap-stack-md max-w-lg mx-auto w-full">
            {/* Header Info Badges Shimmer */}
            <div className="flex flex-wrap gap-2 items-center">
                <div className="h-6 w-20 rounded-full animate-shimmer"></div>
                <div className="h-6 w-32 rounded-full animate-shimmer"></div>
                <div className="h-6 w-24 rounded-full animate-shimmer"></div>
            </div>

            {/* Badge Tipe / Kategori Shimmer */}
            <div className="h-7 w-48 rounded-full animate-shimmer"></div>

            {/* Pendapatan & Judul Kost Shimmer */}
            <div className="flex flex-col gap-1.5 mt-1">
                <div className="h-8 w-44 rounded-xl animate-shimmer"></div>
                <div className="h-6 w-3/4 rounded-xl animate-shimmer"></div>
            </div>

            {/* Kartu Profil Pemilik / Penghuni Shimmer */}
            <div className="p-3.5 rounded-2xl border border-gray-100 bg-gray-50/50 flex items-center gap-3">
                <div className="w-12 h-12 rounded-full animate-shimmer shrink-0"></div>
                <div className="flex-1 space-y-2">
                    <div className="h-3 w-24 rounded-md animate-shimmer"></div>
                    <div className="h-4 w-36 rounded-md animate-shimmer"></div>
                    <div className="h-3 w-28 rounded-md animate-shimmer"></div>
                </div>
            </div>

            {/* Status Banner Shimmer */}
            <div className="h-12 w-full rounded-2xl animate-shimmer"></div>

            {/* Lokasi / Alamat Box Shimmer */}
            <div className="p-3.5 rounded-2xl border border-gray-100 bg-gray-50/50 space-y-2">
                <div className="h-3.5 w-40 rounded-md animate-shimmer"></div>
                <div className="h-3 w-full rounded-md animate-shimmer"></div>
                <div className="h-3 w-2/3 rounded-md animate-shimmer"></div>
            </div>

            {/* Tombol Aksi Shimmer */}
            <div className="h-12 w-full rounded-2xl animate-shimmer mt-1"></div>
        </div>
    );

    const renderTasks = () => {
        // Defensive deduplication to ensure unique cards per task/transaction
        const seenIds = new Set<string>();
        const seenTx = new Set<string>();
        const uniqueSurveyRequests: SurveyRequest[] = [];

        for (const req of (surveyRequests || [])) {
            if (!req || !req.id) continue;
            if (seenIds.has(req.id)) continue;
            if (req.transaction_id && seenTx.has(req.transaction_id)) continue;

            seenIds.add(req.id);
            if (req.transaction_id) seenTx.add(req.transaction_id);
            uniqueSurveyRequests.push(req);
        }

        const filteredRequests = uniqueSurveyRequests.filter(req => {
            if (agentTab === 'pending') return ['PENDING_ASSIGNMENT', 'AGENT_ASSIGNED'].includes(req.status);
            if (agentTab === 'active') return ['HEADING_TO_LOCATION', 'SURVEYING', 'RESCHEDULED', 'SUBMITTED', 'REVISION_REQUIRED', 'NEED_REVISION'].includes(req.status) && !['COMPLETED', 'APPROVED', 'ACTIVE', 'CANCELLED'].includes(req.status);
            if (agentTab === 'history') return ['COMPLETED', 'CANCELLED', 'APPROVED', 'ACTIVE'].includes(req.status);
            return false;
        });

        return (
            <div className="space-y-6 pb-32">
                <div className="bg-white/80 backdrop-blur-md p-1.5 rounded-2xl border border-gray-100 flex gap-1 shadow-sm sticky top-0 z-10 transition-all">
                    {[
                        { id: 'pending', label: 'Permintaan', icon: '📥' },
                        { id: 'active', label: 'Aktif', icon: '⚡' },
                        { id: 'history', label: 'Riwayat', icon: '📜' }
                    ].map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setAgentTab(t.id as any)}
                            className={`flex-1 py-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                                agentTab === t.id 
                                ? 'bg-orange-600 text-white shadow-md scale-[1.02]' 
                                : 'text-gray-500 hover:bg-gray-100'
                            }`}
                        >
                            <span>{t.icon}</span>
                            {t.label}
                            {uniqueSurveyRequests.filter(r => {
                                if (t.id === 'pending') return ['PENDING_ASSIGNMENT', 'AGENT_ASSIGNED'].includes(r.status);
                                if (t.id === 'active') return ['HEADING_TO_LOCATION', 'SURVEYING', 'RESCHEDULED', 'SUBMITTED', 'REVISION_REQUIRED', 'NEED_REVISION'].includes(r.status) && !['COMPLETED', 'APPROVED', 'ACTIVE', 'CANCELLED'].includes(r.status);
                                if (t.id === 'history') return ['COMPLETED', 'CANCELLED', 'APPROVED', 'ACTIVE'].includes(r.status);
                                return false;
                            }).length > 0 && (
                                <span className={`w-2 h-2 rounded-full ${agentTab === t.id ? 'bg-white' : 'bg-red-500'}`} />
                            )}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {isLoading ? (
                        <>
                            <TaskCardSkeleton />
                            <TaskCardSkeleton />
                        </>
                    ) : filteredRequests.length > 0 ? (
                        filteredRequests.map((req: SurveyRequest) => {
                            const isKostManager = checkIsKostManager(req);
                            if (isKostManager) {
                            return (
                                <div key={req.id} className="bg-surface-container-lowest p-stack-md rounded-2xl shadow-soft-float border border-surface-container mb-stack-lg relative overflow-hidden flex flex-col gap-stack-md max-w-lg mx-auto w-full">
                                    {/* Header Info */}
                                    <div className="flex flex-col gap-2">
                                        <div className="flex flex-wrap gap-2 items-center">
                                            <span className="bg-surface-container-high text-on-surface text-label-bold font-bold px-3 py-1 rounded-full">
                                                #{req.id.slice(0, 8).toUpperCase()}
                                            </span>
                                            <span className="flex items-center gap-1 text-on-surface-variant text-label-bold font-bold bg-surface-container px-3 py-1 rounded-full">
                                                <Calendar className="w-3.5 h-3.5 text-on-surface-variant inline shrink-0" /> 
                                                {new Date(req.created_at).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}
                                            </span>
                                            <span className="flex items-center gap-1 text-on-surface-variant text-label-bold font-bold bg-surface-container px-3 py-1 rounded-full">
                                                <Clock className="w-3.5 h-3.5 text-on-surface-variant inline shrink-0" /> 
                                                {new Date(req.created_at).toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit'})} WIB
                                            </span>
                                        </div>
                                        
                                        <div className="inline-flex items-center gap-2 bg-primary-container text-on-primary-container text-label-bold font-bold px-4 py-1.5 rounded-full uppercase tracking-wide w-fit mt-1">
                                            <Zap className="w-4 h-4 fill-current inline shrink-0" />
                                            Pendataan KostManager
                                        </div>
                                        
                                        <div className="mt-1">
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-headline-lg-mobile md:text-headline-lg font-black text-primary">
                                                    {FORMAT_CURRENCY(getSurveyEarnings(req))}
                                                </span>
                                                <span className="text-label-bold font-bold text-on-surface-variant uppercase">
                                                    Komisi Pendapatan
                                                </span>
                                            </div>
                                            <h2 className="text-headline-md font-headline-md text-on-surface mt-1">
                                                {req.kost_name}
                                            </h2>
                                        </div>
                                    </div>

                                    {/* Occupant & Status */}
                                    <div className="grid grid-cols-1 gap-gutter-grid">
                                        <div className="bg-surface-container-lowest p-stack-md rounded-2xl border border-surface-container flex items-center gap-stack-md">
                                            <div className="w-12 h-12 rounded-full bg-secondary text-on-secondary flex items-center justify-center text-headline-md font-black shrink-0">
                                                {(req.user?.name || 'M').charAt(0).toUpperCase()}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-label-sm font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                                                    Mitra Pemesan KostManager
                                                </p>
                                                <p className="text-body-lg font-bold text-on-surface truncate">
                                                    {req.user?.name || 'Mitra Kost'}
                                                </p>
                                                <a 
                                                    className="inline-flex items-center gap-1 text-primary-container mt-1 text-body-md font-medium hover:underline" 
                                                    href={`tel:${req.user?.phone || req.owner_phone || ''}`}
                                                >
                                                    <Phone className="w-3.5 h-3.5 inline shrink-0" /> 
                                                    {req.user?.phone || req.owner_phone || '-'}
                                                </a>
                                            </div>
                                        </div>
                                        
                                        {(() => {
                                            const statusColorMap: any = {
                                                'AWAITING_PAYMENT': 'bg-yellow-100 text-yellow-900 border border-yellow-200',
                                                'PENDING_ASSIGNMENT': 'bg-amber-100 text-amber-900 border border-amber-200',
                                                'AGENT_ASSIGNED': 'bg-orange-100 text-orange-950 border-2 border-orange-400 font-extrabold shadow-sm',
                                                'HEADING_TO_LOCATION': 'bg-indigo-100 text-indigo-900 border border-indigo-200',
                                                'SURVEYING': 'bg-orange-100 text-orange-900 border border-orange-200',
                                                'SUBMITTED': 'bg-emerald-100 text-emerald-950 border border-emerald-300 font-bold',
                                                'REVISION_REQUIRED': 'bg-amber-100 text-amber-950 border-2 border-amber-400 font-extrabold shadow-md animate-pulse',
                                                'NEED_REVISION': 'bg-amber-100 text-amber-950 border-2 border-amber-400 font-extrabold shadow-md animate-pulse',
                                                'COMPLETED': 'bg-emerald-100 text-emerald-950 border border-emerald-300 font-bold',
                                                'APPROVED': 'bg-emerald-100 text-emerald-950 border border-emerald-300 font-bold',
                                                'ACTIVE': 'bg-emerald-100 text-emerald-950 border border-emerald-300 font-bold',
                                                'RESCHEDULED': 'bg-amber-100 text-amber-900 border border-amber-200'
                                            };
                                            const bgClass = statusColorMap[req.status] || 'bg-primary-fixed text-on-primary-fixed';
                                            const labelMap: any = {
                                                'AWAITING_PAYMENT': 'MENUNGGU PEMBAYARAN',
                                                'PENDING_ASSIGNMENT': 'MENUNGGU AGEN',
                                                'AGENT_ASSIGNED': 'TUGAS BARU (PERLU KONFIRMASI)',
                                                'HEADING_TO_LOCATION': 'OTW KE LOKASI',
                                                'SURVEYING': 'SEDANG SURVEY',
                                                'SUBMITTED': 'DATA DIKIRIM (MENUNGGU TINJAUAN ADMIN)',
                                                'REVISION_REQUIRED': '⚠️ PERLU REVISI / EVALUASI ADMIN',
                                                'NEED_REVISION': '⚠️ PERLU REVISI / EVALUASI ADMIN',
                                                'COMPLETED': isKostManager ? 'SELESAI (SUDAH LISTING KOSTMANAGER)' : 'SELESAI',
                                                'APPROVED': 'SELESAI (SUDAH LISTING KOSTMANAGER)',
                                                'ACTIVE': 'SELESAI (SUDAH LISTING KOSTMANAGER)',
                                                'RESCHEDULED': 'JADWAL ULANG'
                                            };
                                            return (
                                                <div className={`p-stack-md rounded-2xl flex items-center justify-center shadow-soft-float ${bgClass}`}>
                                                    <div className="text-center">
                                                        <p className="text-body-lg font-bold uppercase tracking-wider">
                                                            {labelMap[req.status] || req.status}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>

                                    {/* Location Section */}
                                    {(() => {
                                        const meta = req.transaction?.metadata || {};
                                        let lat = requestsCoords[req.id]?.lat || meta.location?.lat || meta.latitude || (req as any).latitude;
                                        let lng = requestsCoords[req.id]?.lng || meta.location?.lng || meta.longitude || (req as any).longitude;
                                        const mapsUrl = meta.googleMapsLink || (req as any).google_maps_url || (lat && lng ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}` : null);
                                        
                                        // Try extracting coordinates from text notes/name if still missing
                                        if (!lat || !lng) {
                                            const extracted = extractCoordinates(meta.googleMapsLink || (req as any).google_maps_url || req.kost_name || req.notes);
                                            if (extracted) {
                                                lat = extracted.lat;
                                                lng = extracted.lng;
                                            }
                                        }
                                        const regexMatch = req.notes?.match(/📍(?: Link)? GPS:\s*(https?:\/\/\S+)/);
                                        const finalUrl = mapsUrl || (regexMatch ? regexMatch[1] : null);

                                        return (
                                            <div className="bg-surface-container-lowest p-stack-md rounded-2xl border border-surface-container flex flex-col gap-4">
                                                <div>
                                                    <h3 className="flex items-center gap-2 text-body-lg font-bold text-on-surface mb-2">
                                                        <MapPin className="w-4 h-4 text-primary fill-primary/20 inline shrink-0" />
                                                        Lokasi Properti &amp; Preview GPS
                                                    </h3>
                                                    <p className="text-body-md font-medium text-on-surface-variant leading-relaxed">
                                                        {req.kost_address}
                                                    </p>
                                                </div>
                                                
                                                {lat && lng && (
                                                    <div className="relative w-full h-48 rounded-xl overflow-hidden border border-outline-variant bg-gray-50">
                                                        <iframe 
                                                            title={`map-preview-${req.id}`}
                                                            width="100%" 
                                                            height="100%" 
                                                            frameBorder="0" 
                                                            style={{ border: 0 }}
                                                            referrerPolicy="no-referrer-when-downgrade"
                                                            src={`https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed`}
                                                            allowFullScreen
                                                            className="w-full h-full border-0 pointer-events-none"
                                                        />
                                                    </div>
                                                )}
                                                
                                                <div className="flex flex-col gap-stack-sm w-full">
                                                    {(finalUrl || (lat && lng)) && (
                                                        <a 
                                                            className="w-full bg-secondary text-on-secondary py-3 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-opacity-90 transition-opacity font-bold text-label-lg shadow-sm"
                                                            href={finalUrl || `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                        >
                                                            <Navigation className="w-4 h-4 inline shrink-0" />
                                                            Buka Rute GPS / Google Maps
                                                        </a>
                                                    )}
                                                    {lat && lng && (
                                                        <div className="w-full bg-surface text-on-surface-variant py-3 px-4 rounded-xl flex items-center justify-center gap-2 border border-outline-variant font-medium text-body-md">
                                                            <MapPin className="w-4 h-4 text-primary inline shrink-0" />
                                                            {lat}, {lng}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* Stats Grid */}
                                    {(() => {
                                        const meta = req.transaction?.metadata || {};
                                        let totalRooms = meta.total_rooms || meta.totalRooms || meta.jumlah_kamar || (req as any).total_rooms;
                                        let emptyRooms = meta.empty_rooms || meta.emptyRooms || meta.kamar_kosong || (req as any).empty_rooms;
                                        let kostType = meta.kost_type || meta.tipe_kost || (req as any).kost_type;

                                        if (!totalRooms && req.notes) {
                                            const m = req.notes.match(/Total Kamar:\s*(\d+)/i);
                                            if (m) totalRooms = m[1];
                                        }
                                        if (emptyRooms === undefined && req.notes) {
                                            const m = req.notes.match(/Kamar Kosong:\s*(\d+)/i);
                                            if (m) emptyRooms = m[1];
                                        }
                                        if (!kostType && req.notes) {
                                            const m = req.notes.match(/Tipe Kost:\s*([^\n,]+)/i);
                                            if (m) kostType = m[1];
                                        }

                                        return (
                                            <div className="flex flex-col gap-stack-sm w-full">
                                                <div className="bg-surface-container-lowest p-stack-md rounded-2xl border border-surface-container text-center">
                                                    <p className="text-label-bold font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                                                        Tipe Kost
                                                    </p>
                                                    <p className="text-headline-md font-headline-md text-on-surface capitalize">{kostType || 'Campur'}</p>
                                                </div>
                                                <div className="bg-surface-container-lowest p-stack-md rounded-2xl border border-surface-container text-center">
                                                    <p className="text-label-bold font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                                                        Total Jumlah Kamar
                                                    </p>
                                                    <p className="text-headline-lg font-headline-lg text-primary">{totalRooms || '5'}</p>
                                                </div>
                                                <div className="bg-surface-container-lowest p-stack-md rounded-2xl border border-surface-container text-center">
                                                    <p className="text-label-bold font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                                                        Jumlah Kamar Kosong
                                                    </p>
                                                    <p className="text-headline-lg font-headline-lg text-secondary">{emptyRooms !== undefined ? emptyRooms : '0'}</p>
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* Kontak Pemilik */}
                                    <div className="bg-surface-container-lowest p-stack-md rounded-2xl border border-surface-container flex flex-col sm:flex-row items-center justify-between gap-stack-md">
                                        <div className="flex items-center gap-stack-sm">
                                            <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant">
                                                <Smartphone className="w-4 h-4 inline shrink-0" />
                                            </div>
                                            <div>
                                                <p className="text-label-sm font-bold text-on-surface-variant uppercase">
                                                    Kontak Pemilik Kost
                                                </p>
                                                <p className="text-body-md font-bold text-on-surface">{req.owner_phone && req.owner_phone !== '-' ? req.owner_phone : (req.user?.phone || '-')}</p>
                                            </div>
                                        </div>
                                        {(req.user?.phone || req.owner_phone) && (
                                            <a 
                                                href={`https://wa.me/${(req.user?.phone || req.owner_phone || '').replace(/[^0-9]/g, '')}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="w-full sm:w-auto bg-[#25D366] text-white py-2 px-6 rounded-xl flex items-center justify-center gap-2 hover:bg-opacity-90 transition-opacity font-bold text-label-lg shadow-sm"
                                            >
                                                <MessageCircle className="w-4 h-4 inline shrink-0" />
                                                Chat WA
                                            </a>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-col gap-2 border-t border-surface-container pt-stack-md mt-2">
                                        {agentTab === 'pending' && (
                                            <div className="flex flex-col gap-2">
                                                <button 
                                                    onClick={async () => {
                                                        if (verificationStatus !== 'verified') {
                                                            alert('Akun Anda belum terverifikasi. Silahkan lengkapi identitas di menu Profil.');
                                                            onMenuChange('profile');
                                                            return;
                                                        }
                                                        if (window.confirm('Terima dan konfirmasi tugas pendataan KostManager ini?')) {
                                                            try {
                                                                setIsSubmitting(true);
                                                                await updateSurveyRequest(req.id, { 
                                                                    status: 'SURVEYING',
                                                                    assigned_agent_id: uid,
                                                                    agent_name: user?.name || user?.displayName || 'Surveyor RuangSinggah',
                                                                    agent_phone: user?.phone || user?.phoneNumber || '',
                                                                    agent_photo_url: user?.photo_url || user?.photoURL || ''
                                                                });
                                                                // Trigger notification safely in background
                                                                notifySurveyStatusUpdate(req.id, 'SURVEYING').catch(e => {
                                                                    console.warn('[AgentDashboard] Notification notice:', e);
                                                                });
                                                                alert('Pesanan Dikonfirmasi & Diterima! Tugas kini ada di tab Aktif.');
                                                                await loadSurveyRequests(true);
                                                                setAgentTab('active');
                                                            } catch (error) {
                                                                console.error('[AgentDashboard] Error accepting task:', error);
                                                                alert('Gagal menerima tugas: ' + ((error as Error)?.message || 'Terjadi kesalahan sistem.'));
                                                            } finally {
                                                                setIsSubmitting(false);
                                                            }
                                                        }
                                                    }} 
                                                    disabled={isSubmitting}
                                                    className={`w-full py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-opacity-90 transition-opacity font-bold text-label-lg shadow-sm ${
                                                        verificationStatus === 'verified' && !isSubmitting
                                                        ? 'bg-primary text-white cursor-pointer active:scale-95'
                                                        : 'bg-surface text-on-surface-variant border border-outline-variant cursor-not-allowed'
                                                    }`}
                                                >
                                                    {isSubmitting ? 'Memproses...' : '⚡ Terima & Konfirmasi Pendataan'}
                                                </button>
                                                <button 
                                                    onClick={async () => {
                                                        if (window.confirm('Yakin ingin menolak tugas ini? Tugas akan dikembalikan ke Admin untuk ditugaskan ulang ke agen lain.')) {
                                                            try {
                                                                setIsSubmitting(true);
                                                                await updateSurveyRequest(req.id, { 
                                                                    status: 'PENDING_ASSIGNMENT',
                                                                    assigned_agent_id: null,
                                                                    agent_name: '',
                                                                    agent_phone: ''
                                                                } as any);
                                                                alert('Tugas berhasil ditolak. Pesanan dikembalikan ke Admin.');
                                                                await loadSurveyRequests(true);
                                                            } catch (error) {
                                                                console.error('[AgentDashboard] Error rejecting task:', error);
                                                                alert('Gagal menolak tugas: ' + ((error as Error)?.message || 'Terjadi kesalahan sistem.'));
                                                            } finally {
                                                                setIsSubmitting(false);
                                                            }
                                                        }
                                                    }} 
                                                    disabled={isSubmitting}
                                                    className="w-full bg-surface text-error border border-error/20 py-3 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-red-50 transition-opacity font-bold text-label-lg shadow-sm cursor-pointer active:scale-95"
                                                >
                                                    Tolak Tugas
                                                </button>
                                            </div>
                                        )}

                                        {agentTab === 'active' && (
                                            <>
                                                {(req.status === 'REVISION_REQUIRED' || req.status === 'NEED_REVISION') ? (() => {
                                                    const evalData = parseEvaluationData(req.notes, req.status);
                                                    return (
                                                        <div className="relative overflow-hidden rounded-2xl border-2 border-amber-400 bg-gradient-to-br from-amber-500/[0.08] via-orange-500/[0.04] to-amber-500/[0.08] p-4 shadow-[0_0_20px_rgba(245,158,11,0.18)] flex flex-col gap-3.5 backdrop-blur-sm transition-all">
                                                            {/* Top Glowing Gradient Accent Bar */}
                                                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 animate-pulse" />
                                                            
                                                            {/* Header with Pulse Icon & Status Pill */}
                                                            <div className="flex items-center justify-between gap-2">
                                                                <div className="flex items-center gap-2.5">
                                                                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0 animate-bounce">
                                                                        <AlertTriangle size={18} />
                                                                    </div>
                                                                    <div>
                                                                        <span className="text-[11px] font-black text-amber-950 uppercase tracking-wider block">
                                                                            Evaluasi &amp; Permintaan Revisi
                                                                        </span>
                                                                        <span className="text-[9px] font-bold text-amber-700 uppercase tracking-widest">
                                                                            Catatan Admin • {evalData.date}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-200/90 text-amber-900 border border-amber-300 text-[9px] font-black uppercase tracking-wider shadow-xs animate-pulse">
                                                                    <Sparkles size={10} className="text-amber-700" />
                                                                    Perlu Tindakan
                                                                </span>
                                                            </div>

                                                            {/* List of Targeted Items as Modern Interactive Chips */}
                                                            {evalData.items.length > 0 && (
                                                                <div className="flex flex-col gap-1.5 pt-1 border-t border-amber-200/60">
                                                                    <span className="text-[10px] font-black text-amber-900 uppercase tracking-wider flex items-center gap-1">
                                                                        <span>📌</span> Bagian yang Perlu Diperbaiki:
                                                                    </span>
                                                                    <div className="flex flex-wrap gap-1.5">
                                                                        {evalData.items.map((item, idx) => (
                                                                            <span 
                                                                                key={idx} 
                                                                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white text-amber-950 font-extrabold text-[11px] border border-amber-200 shadow-xs"
                                                                            >
                                                                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping inline-block shrink-0" />
                                                                                {item}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Admin Note Quote Box */}
                                                            {evalData.adminNote && (
                                                                <div className="bg-white/95 rounded-xl p-3 border border-amber-200 shadow-xs flex flex-col gap-1">
                                                                    <span className="text-[9px] font-black text-amber-800 uppercase tracking-wider flex items-center gap-1">
                                                                        <span>📝</span> Pesan Catatan Admin:
                                                                    </span>
                                                                    <p className="text-xs text-gray-800 font-semibold leading-relaxed whitespace-pre-wrap italic">
                                                                        "{evalData.adminNote}"
                                                                    </p>
                                                                </div>
                                                            )}

                                                            {/* Fallback if neither items nor admin note parsed cleanly */}
                                                            {!evalData.items.length && !evalData.adminNote && (
                                                                <div className="bg-white/95 rounded-xl p-3 border border-amber-200 shadow-xs">
                                                                    <p className="text-xs text-gray-800 font-semibold leading-relaxed">
                                                                        {req.notes || 'Admin meminta evaluasi data pendataan properti. Silakan buka formulir untuk melihat dan memperbaiki data.'}
                                                                    </p>
                                                                </div>
                                                            )}

                                                            {/* CTA Button with Glow & Shimmer */}
                                                            <button 
                                                                onClick={() => openKostManagerListing(req)} 
                                                                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 active:scale-95 transition-all cursor-pointer group"
                                                            >
                                                                <Edit className="w-4 h-4 transition-transform group-hover:scale-110" />
                                                                <span>⚡ Buka &amp; Perbaiki Bagian yang Dievaluasi</span>
                                                                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                                            </button>
                                                        </div>
                                                    );
                                                })() : (req.status === 'SUBMITTED' || req.status === 'PENDING_ONBOARDING') ? (() => {
                                                    const evalData = parseEvaluationData(req.notes, req.status);
                                                    const hasPastRevision = Boolean(req.notes && (req.notes.includes('[REVISI') || req.notes.toLowerCase().includes('catatan evaluasi admin')));

                                                    return (
                                                        <div className="flex flex-col gap-2.5">
                                                            {/* Satu baris kecil memanjang untuk riwayat revisi */}
                                                            {hasPastRevision && (
                                                                <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-950 shadow-2xs">
                                                                    <div className="flex items-center gap-2 min-w-0">
                                                                        <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                                                        <span className="text-[11px] font-semibold truncate">
                                                                            <strong className="text-amber-950 font-black mr-1">Riwayat Revisi:</strong>
                                                                            Terkirim {getFormattedRevisionDateTime(req, evalData)}
                                                                        </span>
                                                                    </div>
                                                                    <span className="px-2 py-0.5 rounded-md bg-amber-200/80 text-amber-900 text-[10px] font-black uppercase tracking-wider shrink-0 border border-amber-300">
                                                                        ✓ Terkirim
                                                                    </span>
                                                                </div>
                                                            )}

                                                            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-start gap-2 text-xs text-emerald-950">
                                                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                                                <div className="flex flex-col gap-0.5">
                                                                    <span className="font-extrabold text-emerald-950">Data Pendataan Dikirim ke Admin</span>
                                                                    <span className="text-[11px] font-medium leading-relaxed text-emerald-800">
                                                                        Data properti &amp; kamar telah dikirim untuk ditinjau oleh Admin. Anda tetap dapat mengedit atau memperbarui data kapan saja.
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <button 
                                                                onClick={() => openKostManagerListing(req)} 
                                                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all font-bold text-label-lg shadow-md active:scale-95 cursor-pointer"
                                                            >
                                                                <Edit className="w-4 h-4 inline shrink-0" />
                                                                ✏️ Edit &amp; Perbarui Data Listing
                                                            </button>
                                                        </div>
                                                    );
                                                })() : (
                                                    <div className="flex flex-col gap-2">
                                                        {req.status === 'AGENT_ASSIGNED' && (
                                                            <button 
                                                                onClick={async () => {
                                                                    if (window.confirm('Mulai perjalanan menuju lokasi kost?')) {
                                                                        await updateSurveyRequest(req.id, { status: 'HEADING_TO_LOCATION' });
                                                                        await loadSurveyRequests(true);
                                                                    }
                                                                }}
                                                                className="w-full py-3.5 px-4 bg-secondary text-on-secondary rounded-xl flex items-center justify-center gap-2 hover:bg-opacity-90 transition-opacity font-bold text-label-lg shadow-sm"
                                                            >
                                                                🚗 OTW Ke Lokasi
                                                            </button>
                                                        )}
                                                        {req.status === 'HEADING_TO_LOCATION' && (
                                                            <button 
                                                                onClick={async () => {
                                                                    if (window.confirm('Mulai pendataan / survey lapangan?')) {
                                                                        await updateSurveyRequest(req.id, { status: 'SURVEYING' });
                                                                        await loadSurveyRequests(true);
                                                                    }
                                                                }}
                                                                className="w-full py-3.5 px-4 bg-primary text-white rounded-xl flex items-center justify-center gap-2 hover:bg-opacity-90 transition-opacity font-bold text-label-lg shadow-sm animate-pulse"
                                                            >
                                                                📷 Mulai Pendataan
                                                            </button>
                                                        )}
                                                        {(req.status === 'SURVEYING' || req.status === 'RESCHEDULED') && (
                                                            <button 
                                                                onClick={() => openKostManagerListing(req)} 
                                                                className="w-full py-3.5 px-4 bg-primary text-white rounded-xl flex items-center justify-center gap-2 hover:bg-opacity-90 transition-opacity font-bold text-label-lg shadow-sm"
                                                            >
                                                                ⚡ Isi Listing & Kamar
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </>
                                        )}

                                        {agentTab === 'history' && (
                                            <button 
                                                onClick={() => openKostManagerListing(req)} 
                                                className="w-full bg-surface text-primary border border-outline-variant py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/5 transition-opacity font-bold text-label-lg shadow-sm"
                                            >
                                                ✅ Lihat Detail Listing
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        }

                        // ── DESAIN LAMA KARTU SURVEY BIASA ───────────────────────────
                        return (
                            <div key={req.id} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row gap-6 hover:shadow-md transition-shadow relative overflow-hidden">
                                {(req.status === 'AGENT_ASSIGNED' || req.status === 'SURVEYING') && <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/10 rounded-bl-full"></div>}
                                <div className="flex-1 space-y-4 relative z-10">
                                    <div className="flex flex-col sm:flex-row justify-between items-start border-b border-gray-50 pb-4 gap-3">
                                        <div>
                                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                <span className="bg-orange-100 text-orange-700 font-bold px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-wider">#{req.id.slice(0,8)}</span>
                                                <span className="text-xs text-gray-400 font-medium">{new Date(req.created_at).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}</span>
                                                <div className="px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-orange-50 text-orange-600 border border-orange-100 italic">🔍 Jasa Survey</div>
                                            </div>
                                            <div className="mb-3 flex items-baseline gap-1.5 flex-wrap">
                                                <span className="text-2xl font-black text-orange-600 tracking-tight leading-none">
                                                    {FORMAT_CURRENCY(getSurveyEarnings(req))}
                                                </span>
                                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none">Komisi Pendapatan</span>
                                            </div>
                                            <p className="font-bold text-gray-900 text-lg leading-tight mb-1">{req.kost_name}</p>
                                            <p className="text-xs text-gray-500 font-medium flex items-center gap-1.5">
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                                {req.user?.name || 'User'}
                                            </p>
                                        </div>
                                        <div className="w-full sm:w-auto">
                                            <span className={`inline-flex w-full sm:w-auto justify-center px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-xl border shadow-sm
                                                ${req.status === 'AWAITING_PAYMENT' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 
                                                  req.status === 'PENDING_ASSIGNMENT' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                                                  req.status === 'HEADING_TO_LOCATION' ? 'bg-indigo-600 text-white border-indigo-600' :
                                                  req.status === 'SURVEYING' ? 'bg-orange-600 text-white border-orange-600 animate-pulse' : 
                                                  req.status === 'SUBMITTED' ? 'bg-blue-600 text-white border-blue-600' :
                                                  req.status === 'COMPLETED' ? 'bg-green-600 text-white border-green-600' : 
                                                  req.status === 'RESCHEDULED' ? 'bg-amber-505 text-white border-amber-600 shadow-amber-100' : 
                                                  req.status === 'REVISION_REQUIRED' || req.status === 'NEED_REVISION' ? 'bg-amber-100 text-amber-950 border-2 border-amber-400 font-extrabold animate-pulse' :
                                                  'bg-red-50 text-red-700 border-red-200'}`}>
                                                {req.status === 'AWAITING_PAYMENT' ? 'Menunggu Bayar' : 
                                                 req.status === 'PENDING_ASSIGNMENT' ? 'Menunggu Agen' : 
                                                 req.status === 'AGENT_ASSIGNED' ? 'Tugas Baru' : 
                                                 req.status === 'HEADING_TO_LOCATION' ? 'Menuju Lokasi' :
                                                 req.status === 'SURVEYING' ? 'Sedang Survey' : 
                                                 req.status === 'SUBMITTED' ? 'Menunggu Konfirmasi' :
                                                 req.status === 'COMPLETED' ? 'Selesai' : 
                                                 req.status === 'RESCHEDULED' ? 'Jadwal Ulang' : 
                                                 req.status === 'REVISION_REQUIRED' || req.status === 'NEED_REVISION' ? '⚠️ Perlu Revisi / Evaluasi' :
                                                 req.status}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 shrink-0 border border-gray-150 mt-1">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Lokasi Kost</p>
                                                <p className="font-bold text-gray-900 text-xs sm:text-sm leading-relaxed">{req.kost_address}</p>
                                                {(() => {
                                                    const meta = req.transaction?.metadata || {};
                                                    let lat = requestsCoords[req.id]?.lat || meta.location?.lat || meta.latitude || (req as any).latitude;
                                                    let lng = requestsCoords[req.id]?.lng || meta.location?.lng || meta.longitude || (req as any).longitude;
                                                    const mapsUrl = meta.googleMapsLink || (req as any).google_maps_url || (lat && lng ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}` : null);
                                                    
                                                    // Try extracting coordinates from text notes/name if still missing
                                                    if (!lat || !lng) {
                                                        const extracted = extractCoordinates(meta.googleMapsLink || (req as any).google_maps_url || req.kost_name || req.notes);
                                                        if (extracted) {
                                                            lat = extracted.lat;
                                                            lng = extracted.lng;
                                                        }
                                                    }
                                                    const regexMatch = req.notes?.match(/📍(?: Link)? GPS:\s*(https?:\/\/\S+)/);
                                                    const finalUrl = mapsUrl || (regexMatch ? regexMatch[1] : null);

                                                    if (finalUrl) {
                                                        return (
                                                            <div className="mt-2 flex flex-col gap-1">
                                                                <a 
                                                                    href={finalUrl} 
                                                                    target="_blank" 
                                                                    rel="noopener noreferrer" 
                                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-600 text-[10px] font-black uppercase tracking-wider transition-all border border-orange-200 shadow-sm w-max"
                                                                >
                                                                    📍 Buka Rute GPS / Maps
                                                                </a>
                                                                {lat && lng && (
                                                                    <p className="text-[9px] text-gray-400 font-bold tracking-tight">
                                                                        Koordinat: {lat}, {lng}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                })()}
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 shrink-0 border border-gray-100 mt-1">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                            </div>
                                            <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Jadwal Survey</p><p className="font-bold text-orange-700 text-xs sm:text-sm">{req.survey_date} · {req.survey_time}</p></div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 shrink-0 border border-gray-100 mt-1">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                            </div>
                                            <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Kontak Pemilik</p><p className="font-bold text-gray-900 text-xs sm:text-sm">{req.owner_phone && req.owner_phone !== '-' ? req.owner_phone : (req.user?.phone || '-')}</p></div>
                                        </div>
                                    </div>
                                    {req.status === 'RESCHEDULED' && (
                                        <div className="bg-amber-50 rounded-2xl p-3 border border-amber-100 flex items-start gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-amber-500 shadow-sm shrink-0 mt-0.5">🗓️</div>
                                            <div className="flex-1">
                                                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Informasi Jadwal Ulang</p>
                                                <p className="text-xs text-amber-800 font-medium leading-relaxed italic">"{req.notes || 'User/Admin meminta perubahan jadwal survey sesuai kesepakatan baru.'}"</p>
                                            </div>
                                        </div>
                                    )}
                                    {req.notes && req.status !== 'RESCHEDULED' && (
                                        <div className="bg-gray-50 rounded-2xl p-3 border border-gray-150">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Catatan Pemesan</p>
                                            <p className="text-sm text-gray-700 italic">"{req.notes}"</p>
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col gap-2.5 md:w-52 shrink-0 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6 relative z-10">
                                    {agentTab === 'pending' && (
                                        <div className="flex flex-col gap-2">
                                            <button 
                                                onClick={async () => {
                                                    if (verificationStatus !== 'verified') {
                                                        alert('Akun Anda belum terverifikasi. Silahkan lengkapi identitas di menu Profil.');
                                                        onMenuChange('profile');
                                                        return;
                                                    }
                                                    if (window.confirm('Terima dan konfirmasi tugas survey ini?')) {
                                                        try {
                                                            setIsSubmitting(true);
                                                            await updateSurveyRequest(req.id, { 
                                                                status: 'SURVEYING',
                                                                assigned_agent_id: uid,
                                                                agent_name: user?.name || user?.displayName || 'Surveyor RuangSinggah',
                                                                agent_phone: user?.phone || user?.phoneNumber || '',
                                                                agent_photo_url: user?.photo_url || user?.photoURL || ''
                                                            });
                                                            // Trigger notification safely in background
                                                            notifySurveyStatusUpdate(req.id, 'SURVEYING').catch(e => {
                                                                console.warn('[AgentDashboard] Notification notice:', e);
                                                            });
                                                            alert('Pesanan Dikonfirmasi & Diterima! Tugas kini ada di tab Aktif.');
                                                            await loadSurveyRequests(true);
                                                            setAgentTab('active');
                                                        } catch (error) {
                                                            console.error('[AgentDashboard] Error accepting task:', error);
                                                            alert('Gagal menerima tugas: ' + ((error as Error)?.message || 'Terjadi kesalahan sistem.'));
                                                        } finally {
                                                            setIsSubmitting(false);
                                                        }
                                                    }
                                                }} 
                                                disabled={isSubmitting}
                                                className={`w-full py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-sm active:scale-95 transition-all ${
                                                    verificationStatus === 'verified' && !isSubmitting
                                                    ? 'bg-orange-600 hover:bg-orange-700 text-white cursor-pointer' 
                                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                }`}
                                            >
                                                {isSubmitting ? 'Memproses...' : 'Terima & Konfirmasi Tugas'}
                                            </button>
                                            <button 
                                                onClick={async () => {
                                                    if (window.confirm('Yakin ingin menolak tugas ini? Tugas akan dikembalikan ke Admin untuk ditugaskan ulang ke agen lain.')) {
                                                        try {
                                                            setIsSubmitting(true);
                                                            await updateSurveyRequest(req.id, { 
                                                                status: 'PENDING_ASSIGNMENT',
                                                                assigned_agent_id: null,
                                                                agent_name: '',
                                                                agent_phone: ''
                                                            } as any);
                                                            alert('Tugas berhasil ditolak. Pesanan dikembalikan ke Admin.');
                                                            await loadSurveyRequests(true);
                                                        } catch (error) {
                                                            console.error('[AgentDashboard] Error rejecting task:', error);
                                                            alert('Gagal menolak tugas: ' + ((error as Error)?.message || 'Terjadi kesalahan sistem.'));
                                                        } finally {
                                                            setIsSubmitting(false);
                                                        }
                                                    }
                                                }} 
                                                disabled={isSubmitting}
                                                className="w-full bg-red-50 hover:bg-red-500 text-red-600 hover:text-white border border-red-200 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer active:scale-95"
                                            >
                                                Tolak Tugas
                                            </button>
                                        </div>
                                    )}
                                    
                                    {agentTab === 'active' && (
                                        <>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button 
                                                    onClick={async () => {
                                                        try {
                                                            setIsSubmitting(true);
                                                            await updateSurveyRequest(req.id, { status: 'HEADING_TO_LOCATION' });
                                                            await notifySurveyStatusUpdate(req.id, 'HEADING_TO_LOCATION');
                                                            await loadSurveyRequests(true);
                                                        } catch (e) {
                                                            alert('Gagal update status');
                                                        } finally {
                                                            setIsSubmitting(false);
                                                        }
                                                    }}
                                                    disabled={isSubmitting || req.status === 'HEADING_TO_LOCATION' || req.status === 'SURVEYING' || req.status === 'COMPLETED'}
                                                    className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-tight shadow-sm transition-all border-b-4 active:border-b-0 active:translate-y-1 ${
                                                        req.status === 'HEADING_TO_LOCATION' || req.status === 'SURVEYING' || req.status === 'COMPLETED'
                                                        ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                                        : 'bg-orange-600 hover:bg-orange-700 text-white border-orange-800'
                                                    }`}
                                                >
                                                    🚗 {req.status === 'HEADING_TO_LOCATION' || req.status === 'SURVEYING' || req.status === 'COMPLETED' ? 'Sudah OTW' : 'Menuju Lokasi'}
                                                </button>
                                                <button 
                                                    onClick={async () => {
                                                        try {
                                                            setIsSubmitting(true);
                                                            await updateSurveyRequest(req.id, { status: 'SURVEYING' });
                                                            await notifySurveyStatusUpdate(req.id, 'SURVEYING');
                                                            await loadSurveyRequests(true);
                                                        } catch (e) {
                                                            alert('Gagal update status');
                                                        } finally {
                                                            setIsSubmitting(false);
                                                        }
                                                    }}
                                                    disabled={isSubmitting || req.status !== 'HEADING_TO_LOCATION'}
                                                    className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-tight shadow-sm transition-all border-b-4 active:border-b-0 active:translate-y-1 ${
                                                        req.status === 'HEADING_TO_LOCATION'
                                                        ? 'bg-orange-500 hover:bg-orange-600 text-white border-orange-700'
                                                        : req.status === 'SURVEYING' || req.status === 'COMPLETED'
                                                        ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                                        : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                                    }`}
                                                >
                                                    📷 {req.status === 'SURVEYING' || req.status === 'COMPLETED' ? 'Sedang Survey' : 'Sedang Survey'}
                                                </button>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-2 mt-1">
                                                <button onClick={() => window.open(`https://wa.me/${req.user?.phone}?text=${encodeURIComponent(`Halo ${req.user?.name}, saya Arif agen survey RuangSinggah.`)}`, '_blank')} className="bg-green-50 hover:bg-green-500 text-green-600 hover:text-white border border-green-200 py-2.5 rounded-xl text-[10px] font-bold transition-all flex justify-center items-center gap-1">
                                                    💬 Chat User
                                                </button>
                                                <button onClick={() => window.open(`https://wa.me/${req.owner_phone}?text=${encodeURIComponent(`Halo Pemilik Kost, saya Arif agen survey RuangSinggah.`)}`, '_blank')} className="bg-orange-50 hover:bg-orange-500 text-orange-600 hover:text-white border border-orange-200 py-2.5 rounded-xl text-[10px] font-bold transition-all flex justify-center items-center gap-1">
                                                    🏢 Chat Pemilik
                                                </button>
                                            </div>

                                            {req.result_drive_link && (
                                                <button 
                                                    onClick={() => window.open(req.result_drive_link, '_blank')} 
                                                    className="w-full bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all mt-1"
                                                >
                                                    📁 Buka Folder Drive (Upload)
                                                </button>
                                            )}

                                            <button 
                                                onClick={() => {
                                                    setIsReschedulingSurvey(req);
                                                    setNewSurveyDate(req.survey_date || '');
                                                    setNewSurveyTime(req.survey_time || '');
                                                    setRescheduleReason(req.notes && req.status === 'RESCHEDULED' ? req.notes : '');
                                                }} 
                                                className="w-full bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                                            >
                                                📅 Jadwal Ulang
                                            </button>

                                            <button 
                                                onClick={() => openSurveyEditor(req, 'COMPLETED')} 
                                                className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-md animate-pulse active:scale-95 transition-all flex justify-center items-center gap-2"
                                            >
                                                📝 Buat Laporan
                                            </button>
                                        </>
                                    )}

                                    {agentTab === 'history' && (
                                        <>
                                            <button 
                                                onClick={() => openSurveyEditor(req, req.status)} 
                                                className="w-full bg-white hover:bg-orange-50 text-orange-600 border border-orange-200 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex justify-center items-center gap-2"
                                            >
                                                {req.evaluation_summary?.room_facilities ? '✅ Lihat Laporan' : '📝 Detail Progress'}
                                            </button>

                                            <div className="mt-3 bg-orange-50/50 rounded-2xl p-4 border border-orange-100 flex flex-col gap-2">
                                                <div className="flex justify-between items-center">
                                                    <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Rating & Feedback User</p>
                                                    {req.user_rating ? (
                                                        <div className="flex text-yellow-500 text-[10px]">
                                                            {[...Array(5)].map((_, i) => (
                                                                <span key={i}>{i < (req.user_rating || 0) ? '★' : '☆'}</span>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span className="text-[9px] font-bold text-gray-400 italic">Belum ada rating</span>
                                                    )}
                                                </div>
                                                <p className={`text-xs italic font-medium leading-relaxed ${req.user_comment ? 'text-gray-700' : 'text-gray-400'}`}>
                                                    {req.user_comment ? `"${req.user_comment}"` : 'User belum memberikan ulasan.'}
                                                </p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="bg-gray-50 rounded-[2.5rem] p-12 text-center border-2 border-dashed border-gray-200">
                        <p className="text-gray-500 font-bold">Belum ada tugas di tab ini.</p>
                    </div>
                )}
                </div>
            </div>
        );
    };

    const renderWallet = () => (
        <div className="space-y-6">
            <div className="bg-gray-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/20 rounded-full -mr-32 -mt-32 blur-3xl transition-all group-hover:bg-orange-500/30"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500/10 rounded-full -ml-32 -mb-32 blur-3xl"></div>
                
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-10">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Saldo Pendapatan Agen</p>
                            <h3 className="text-4xl font-black">{FORMAT_CURRENCY(stats.availableBalance)}</h3>
                        </div>
                        <div className="w-12 h-12 bg-white/10 rounded-2xl backdrop-blur-md flex items-center justify-center text-xl">💳</div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                        <button 
                            onClick={() => setShowWithdrawConfirm(true)}
                            className="w-full sm:w-auto px-10 py-4 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl shadow-orange-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 group"
                        >
                            Tarik Saldo
                            <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
                <div className="flex p-1.5 gap-1 border-b border-gray-50 bg-gray-50/50">
                    <button onClick={() => setWalletView('balance')} className={`flex-1 py-3 rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-wider truncate whitespace-nowrap px-1 transition-all ${walletView === 'balance' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Dompet</button>
                    <button onClick={() => setWalletView('history')} className={`flex-1 py-3 rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-wider truncate whitespace-nowrap px-1 transition-all ${walletView === 'history' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Riwayat WD</button>
                    <button onClick={() => setWalletView('bank')} className={`flex-1 py-3 rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-wider truncate whitespace-nowrap px-1 transition-all ${walletView === 'bank' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>Rekening</button>
                </div>

                <div className="p-6">
                    {walletView === 'balance' && (
                        <div className="space-y-6">
                             <div className="bg-orange-50 border border-orange-100 rounded-3xl p-6 flex gap-4 items-center">
                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-xl shadow-sm">💡</div>
                                <p className="text-xs font-bold text-orange-900 leading-relaxed flex-1 min-w-0">Pencairan dana diproses setiap hari kerja. Pastikan nomor rekening sudah benar sebelum melakukan penarikan.</p>
                            </div>
                            
                            <div>
                                <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 ml-1">Transaksi Terakhir</h5>
                                <div className="space-y-3">
                                    {allTransactions.length === 0 ? (
                                        <div className="text-center py-6 text-gray-400 font-bold text-xs">Belum ada transaksi.</div>
                                    ) : (
                                        allTransactions.map((tx) => (
                                            <div key={tx.id} className="flex justify-between items-center p-4 rounded-2xl bg-gray-50 border border-gray-50 hover:bg-white hover:border-orange-100 transition-all group gap-4 min-w-0">
                                                <div className="flex items-center gap-4 min-w-0 flex-1">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                                                        tx.type === 'IN' ? 'bg-green-100 text-green-600' : 'bg-rose-100 text-rose-600'
                                                    }`}>
                                                        {tx.type}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-xs font-black text-gray-900 flex items-center gap-1.5 min-w-0">
                                                            <span className="block truncate flex-1">{tx.title}</span>
                                                            {tx.type === 'OUT' && tx.status === 'pending' && (
                                                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-800 uppercase tracking-wider shrink-0">Diproses</span>
                                                            )}
                                                        </p>
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight mt-0.5">{tx.date.toLocaleDateString('id-ID')}</p>
                                                    </div>
                                                </div>
                                                <p className={`text-sm font-black shrink-0 ${
                                                    tx.type === 'IN' ? 'text-green-600' : 'text-rose-600'
                                                }`}>
                                                    {tx.type === 'IN' ? '+' : '-'}{FORMAT_CURRENCY(tx.amount)}
                                                </p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {walletView === 'history' && (
                        <div className="space-y-4">
                            {isLoadingWallet ? (
                                <div className="text-center py-8 text-gray-400 font-bold text-xs">Memuat riwayat...</div>
                            ) : withdrawalHistory.length === 0 ? (
                                <div className="text-center py-8 text-gray-400 font-bold text-xs">Belum ada riwayat penarikan.</div>
                            ) : (
                                withdrawalHistory.map((wd) => (
                                    <div key={wd.id} className="flex justify-between items-center p-5 rounded-3xl bg-gray-50 border border-gray-50">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-xl shadow-sm">🏧</div>
                                            <div>
                                                <p className="text-xs font-black text-gray-900">{FORMAT_CURRENCY(Number(wd.amount))}</p>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{new Date(wd.created_at).toLocaleDateString()} · {wd.bank_name}</p>
                                            </div>
                                        </div>
                                        <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                                            wd.status === 'approved' ? 'bg-green-100 text-green-700' :
                                            wd.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                            'bg-yellow-100 text-yellow-700'
                                        }`}>
                                            {wd.status === 'approved' ? 'Selesai' :
                                             wd.status === 'rejected' ? 'Ditolak' :
                                             'Menunggu'}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {walletView === 'bank' && (
                        <div className="space-y-6 max-w-md mx-auto">
                            <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Bank</label>
                                        <select 
                                            className="w-full mt-1.5 bg-white border border-gray-200 rounded-2xl px-5 py-3.5 text-sm font-bold focus:ring-2 focus:ring-orange-600 outline-none transition-all cursor-pointer" 
                                            value={agentBankName} 
                                            onChange={e => setAgentBankName(e.target.value)}
                                        >
                                            {INDONESIAN_BANKS.map((bank, index) => (
                                                <option key={index} value={bank}>{bank}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">No. Rekening</label><input className="w-full mt-1.5 bg-white border border-gray-200 rounded-2xl px-5 py-3.5 text-sm font-bold focus:ring-2 focus:ring-orange-600 outline-none transition-all" value={agentBankAccount} onChange={e => setAgentBankAccount(e.target.value)} /></div>
                                    <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Atas Nama</label><input className="w-full mt-1.5 bg-white border border-gray-200 rounded-2xl px-5 py-3.5 text-sm font-bold focus:ring-2 focus:ring-orange-600 outline-none transition-all" value={agentAccountName} onChange={e => setAgentAccountName(e.target.value)} /></div>
                                </div>
                            </div>
                            <button onClick={saveBankSettings} className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">Simpan Rekening Default</button>
                        </div>
                    )}
                </div>
            </div>

            {showWithdrawConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm" onClick={() => setShowWithdrawConfirm(false)}></div>
                    <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl relative z-10 p-8 animate-in zoom-in-95 text-center border border-gray-100">
                        <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-5 text-2xl shadow-inner animate-bounce">💰</div>
                        <h3 className="text-2xl font-black text-gray-900 tracking-tight mb-1">Konfirmasi Penarikan</h3>
                        <p className="text-sm text-gray-500 mb-6">Pastikan detail rekening dan nominal di bawah sudah benar.</p>
                        
                        <div className="space-y-4 mb-6">
                            <div className="bg-orange-50/50 border border-orange-100 rounded-2xl p-5 text-center">
                                <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest mb-1">Jumlah Tarik</p>
                                <p className="text-3xl font-black text-orange-600">{FORMAT_CURRENCY(stats.availableBalance)}</p>
                            </div>
                            
                            <div className="bg-gray-50/50 border border-gray-100 rounded-2xl p-5 text-left">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Tujuan Rekening</p>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white rounded-xl border border-gray-200/80 flex items-center justify-center text-lg shadow-sm">🏦</div>
                                    <div>
                                        <p className="font-extrabold text-gray-900 text-sm">{agentBankName}</p>
                                        <p className="text-xs text-gray-500 font-bold mt-0.5">{agentBankAccount}</p>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">a.n. {agentAccountName}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button 
                                onClick={() => setShowWithdrawConfirm(false)}
                                className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl text-xs font-black uppercase tracking-widest transition-all active:scale-[0.98]"
                            >
                                Batal
                            </button>
                            <button 
                                onClick={handleWithdraw}
                                disabled={isWithdrawing}
                                className="flex-1 py-3.5 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-orange-600/10 active:scale-[0.98] transition-all disabled:opacity-50"
                            >
                                {isWithdrawing ? 'Memproses...' : 'Tarik Sekarang'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );


    const render = (
        <div className="min-h-screen bg-gray-50 font-sans flex flex-col lg:flex-row w-full max-w-full overflow-x-hidden">

            {/* ── DESKTOP SIDEBAR ───────────────────────────────────────────── */}
            <aside className="hidden lg:flex w-64 xl:w-72 shrink-0 flex-col bg-white border-r border-gray-100 fixed top-0 left-0 h-full z-30 shadow-sm">
                {/* Logo */}
                <div className="p-6 border-b border-gray-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-[1.2rem] bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                            <Zap size={20} className="text-white" fill="currentColor" />
                        </div>
                        <div>
                            <h1 className="text-[15px] font-black text-gray-900 leading-none tracking-tight">ruangsinggah.id</h1>
                            <p className="text-[10px] text-orange-500 font-black uppercase tracking-[0.2em] mt-1 whitespace-nowrap">AGENT DASHBOARD</p>
                        </div>
                    </div>
                </div>

                {/* User Info */}
                <div className="px-4 py-5 border-b border-gray-50">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                        <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-black text-sm shrink-0 overflow-hidden">
                            {(user?.photoURL || user?.photo_url) && !profileImgError ? (
                                <img 
                                    src={user.photoURL || user.photo_url} 
                                    alt="Profile" 
                                    className="w-full h-full object-cover" 
                                    onError={() => setProfileImgError(true)}
                                />
                            ) : (
                                user?.displayName?.charAt(0) || user?.name?.charAt(0) || 'A'
                            )}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-black text-gray-900 truncate">{user?.displayName || user?.name || 'Surveyor'}</p>
                            <p className={`text-[10px] font-bold uppercase tracking-wide flex items-center gap-1 ${verificationStatus === 'verified' ? 'text-green-500' : 'text-orange-500'}`}>
                                {verificationStatus === 'verified' ? 'verified agent ✓' : 'unverified'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Nav Items */}
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto border-b border-gray-50">
                    <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.2em] px-4 mb-3">Menu Utama</p>
                    {NAV_ITEMS.map(item => (
                        <SideNavItem
                            key={item.key}
                            active={activeMenu === item.key}
                            icon={item.icon}
                            label={item.label}
                            badge={item.badge}
                            onClick={() => onMenuChange(item.key as any)}
                        />
                    ))}
                </nav>

                {/* Logout */}
                <div className="p-4 border-t border-gray-50">
                    <button
                        onClick={() => onLogout?.()}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                    >
                        <LogOut size={18} />
                        Keluar Akun
                    </button>
                </div>
            </aside>

            {/* ── MOBILE OVERLAY SIDEBAR ───────────────────────────────────── */}
            {mobileSidebarOpen && (
                <div className="lg:hidden fixed inset-0 z-50 flex">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileSidebarOpen(false)} />
                    <aside className="relative w-72 bg-white h-full flex flex-col shadow-2xl z-10">
                        <div className="p-5 border-b border-gray-50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-[1.1rem] bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                                   <Zap size={20} className="text-white" fill="currentColor" />
                                </div>
                                <div className="flex flex-col">
                                   <h1 className="text-[14px] font-black text-gray-900 leading-tight tracking-tight">ruangsinggah.id</h1>
                                   <p className="text-[9px] text-orange-500 font-black uppercase tracking-widest leading-none mt-0.5">AGENT DASHBOARD</p>
                                </div>
                            </div>
                            <button onClick={() => setMobileSidebarOpen(false)} className="p-2 rounded-xl hover:bg-gray-50">
                                <X size={20} className="text-gray-400" />
                            </button>
                        </div>
                        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                            {NAV_ITEMS.map(item => (
                                <SideNavItem
                                    key={item.key}
                                    active={activeMenu === item.key}
                                    icon={item.icon}
                                    label={item.label}
                                    badge={item.badge}
                                    onClick={() => { onMenuChange(item.key as any); setMobileSidebarOpen(false); }}
                                />
                            ))}
                        </nav>
                        <div className="p-4 border-t border-gray-50">
                            <button
                                onClick={() => { onLogout?.(); setMobileSidebarOpen(false); }}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                            >
                                <LogOut size={18} />
                                Keluar Akun
                            </button>
                        </div>
                    </aside>
                </div>
            )}

            {/* ── MAIN CONTENT ─────────────────────────────────────────────── */}
            <div className="flex-1 lg:ml-64 xl:ml-72 flex flex-col min-h-screen">

                {/* ── MOBILE TOP BAR ──────────────────────────────────────── */}
                <header className="lg:hidden sticky top-0 z-20 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between shadow-sm">
                    <button
                        onClick={() => setMobileSidebarOpen(true)}
                        className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-gray-50 transition-colors"
                    >
                        <Menu size={22} className="text-gray-700" />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-[1.1rem] bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                            <Zap size={18} className="text-white" fill="currentColor" />
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-[15px] font-black text-gray-900 leading-tight tracking-tight">ruangsinggah.id</h1>
                            <p className="text-[10px] text-orange-500 font-black uppercase tracking-widest leading-none mt-0.5">AGENT DASHBOARD</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-gray-50 relative">
                            <Bell size={20} className="text-gray-500" />
                            {surveyRequests.filter(r => r.status === 'PENDING_ASSIGNMENT').length > 0 && <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border border-white" />}
                        </button>
                        <button 
                            onClick={() => onMenuChange('profile')}
                            className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-black text-xs overflow-hidden"
                        >
                            {(user?.photoURL || user?.photo_url) && !profileImgError ? (
                                <img 
                                    src={user.photoURL || user.photo_url} 
                                    alt="Profile" 
                                    className="w-full h-full object-cover" 
                                    onError={() => setProfileImgError(true)}
                                />
                            ) : (
                                user?.displayName?.charAt(0) || user?.name?.charAt(0) || 'A'
                            )}
                        </button>
                    </div>
                </header>

                {/* ── DESKTOP TOP BAR ─────────────────────────────────────── */}
                <header className="hidden lg:flex sticky top-0 z-20 bg-white border-b border-gray-100 px-8 py-4 items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black text-gray-900">
                            { activeMenu === 'overview' ? 'Selamat Datang, Agen 👋' :
                              activeMenu === 'tasks' ? 'Daftar Tugas Survey' :
                              activeMenu === 'wallet' ? 'Dompet & Pendapatan' : 'Profil Surveyor' }
                        </h2>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                            { new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) }
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-50 text-orange-600 font-black text-[10px] uppercase tracking-widest border border-orange-100">
                             <ShieldCheck size={14} />
                             {verificationStatus === 'verified' ? 'Verified surveyor' : 'Pending Verification'}
                        </button>
                        <div className="w-px h-6 bg-gray-100 mx-2" />
                        <button className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-gray-50 relative group transition-all">
                            <Bell size={20} className="text-gray-400 group-hover:text-orange-500" />
                            {surveyRequests.filter(r => r.status === 'PENDING_ASSIGNMENT').length > 0 && <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border border-white" />}
                        </button>
                        <button 
                            onClick={() => onMenuChange('profile')}
                            className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-2xl hover:bg-gray-50 transition-all group"
                        >
                            <div className="text-right hidden xl:block">
                                <p className="text-xs font-black text-gray-900">{user?.displayName || user?.name || 'Surveyor'}</p>
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter mt-1">ID: #{uid.slice(0, 6)}</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white font-black text-sm shadow-md shadow-orange-500/20 overflow-hidden">
                                {(user?.photoURL || user?.photo_url) && !profileImgError ? (
                                    <img 
                                        src={user.photoURL || user.photo_url} 
                                        alt="Profile" 
                                        className="w-full h-full object-cover" 
                                        onError={() => setProfileImgError(true)}
                                    />
                                ) : (
                                    user?.displayName?.charAt(0) || user?.name?.charAt(0) || 'A'
                                )}
                            </div>
                        </button>
                    </div>
                </header>

                {/* ── SCROLLABLE CONTENT ───────────────────────────────────── */}
                <main className="flex-1 p-4 lg:p-8 pb-32 min-w-0 overflow-x-hidden">
                    {activeMenu === 'overview' && <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">{renderOverview()}</div>}
                    {activeMenu === 'tasks' && <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">{renderTasks()}</div>}
                    {activeMenu === 'wallet' && <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">{renderWallet()}</div>}
                    {activeMenu === 'profile' && <div className="animate-in fade-in slide-in-from-bottom-4 duration-500"><AgentProfile uid={uid} onEditModeChange={() => {}} /></div>}
                </main>

                {/* ── MOBILE BOTTOM NAV ────────────────────────────────────── */}
                <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-100 z-20 flex items-center px-2 pt-1 pb-safe-or-2 shadow-[0_-8px_30px_rgba(0,0,0,0.05)]" style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}>
                    {NAV_ITEMS.map(item => (
                        <BottomNavItem
                            key={item.key}
                            active={activeMenu === item.key}
                            icon={item.icon}
                            label={item.label}
                            badge={item.badge}
                            onClick={() => onMenuChange(item.key as any)}
                        />
                    ))}
                </nav>

                {/* ── MODAL SURVEY REPORT (AGENT) ────────────────────────────── */}
                {isEditingSurvey && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm" onClick={() => setIsEditingSurvey(null)}></div>
                        <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl relative z-10 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <div><h2 className="text-xl font-black uppercase text-gray-900">Form Laporan Survey</h2><p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Lengkapi data pengecekan</p></div>
                                <button onClick={() => setIsEditingSurvey(null)} className="w-8 h-8 flex items-center justify-center border rounded-full hover:bg-white transition-colors">&times;</button>
                            </div>
                            <form onSubmit={handleUpdateSurvey} className="flex-grow overflow-y-auto p-0 m-0">
                                <div className="p-6 space-y-5">
                                    {localStorage.getItem(`survey_draft_${isEditingSurvey.id}`) && (
                                        <div className="bg-orange-50 text-orange-800 text-[11px] font-bold px-4 py-3 rounded-2xl border border-orange-100 flex items-center justify-between gap-2 mb-4 animate-in slide-in-from-top duration-200">
                                            <span>🔄 Memulihkan draf laporan otomatis.</span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (window.confirm("Hapus draf laporan ini dan mulai ulang dari awal?")) {
                                                        localStorage.removeItem(`survey_draft_${isEditingSurvey.id}`);
                                                        setSurveyForm({
                                                            status: isEditingSurvey.status === 'COMPLETED' ? 'COMPLETED' : isEditingSurvey.status,
                                                            assigned_agent_id: isEditingSurvey.assigned_agent_id,
                                                            agent_name: isEditingSurvey.agent_name,
                                                            agent_phone: isEditingSurvey.agent_phone,
                                                            result_drive_link: isEditingSurvey.result_drive_link,
                                                            evaluation_summary: isEditingSurvey.evaluation_summary || {}
                                                        });
                                                    }
                                                }}
                                                className="text-[9px] font-black uppercase px-2 py-1 bg-white hover:bg-orange-100 text-orange-700 rounded-lg border border-orange-200 transition-colors shadow-sm"
                                            >
                                                Mulai Ulang
                                            </button>
                                        </div>
                                    )}
                                    <div>
                                        <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                                            Summary Penilaian Surveyor
                                        </h3>
                                        
                                        <div className="space-y-4">
                                            {/* WA Evidence Section */}
                                            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 mb-6">
                                                <label className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Bukti Screenshot WhatsApp Video Call / Chat dengan user</label>
                                                <div className="mt-1.5 flex items-center gap-3">
                                                    {(isEditingSurvey?.status !== 'COMPLETED' && isEditingSurvey?.status !== 'SUBMITTED') && (
                                                        <label className="flex-1 bg-white border border-dashed border-gray-300 shadow-sm rounded-xl px-4 py-4 text-xs font-black text-gray-500 cursor-pointer hover:bg-gray-50 hover:border-gray-400 hover:text-gray-700 transition-all flex flex-col items-center justify-center gap-2">
                                                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                                            </div>
                                                            <span className="uppercase tracking-widest">{(surveyForm.evaluation_summary as any)?.whatsapp_evidence_url ? 'Ganti Bukti WA' : 'Upload Bukti WA'}</span>
                                                            <input 
                                                                type="file" 
                                                                accept="image/*" 
                                                                className="hidden" 
                                                                onChange={(e) => handleSurveyPhotoUpload('whatsapp_evidence_url', e.target.files)} 
                                                            />
                                                        </label>
                                                    )}
                                                    {(surveyForm.evaluation_summary as any)?.whatsapp_evidence_url && (
                                                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-xl overflow-hidden border border-orange-200 flex-shrink-0 cursor-zoom-in group relative" onClick={() => window.open(Array.isArray((surveyForm.evaluation_summary as any).whatsapp_evidence_url) ? (surveyForm.evaluation_summary as any).whatsapp_evidence_url[0] : (surveyForm.evaluation_summary as any).whatsapp_evidence_url, '_blank')}>
                                                            <img 
                                                                src={Array.isArray((surveyForm.evaluation_summary as any).whatsapp_evidence_url) ? (surveyForm.evaluation_summary as any).whatsapp_evidence_url[0] : (surveyForm.evaluation_summary as any).whatsapp_evidence_url} 
                                                                className="w-full h-full object-cover transition-transform group-hover:scale-110" 
                                                                alt="WA Evidence" 
                                                            />
                                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {[
                                                { id: 'kost_type', label: 'Jenis Kost', icon: '👤' },
                                                { id: 'room_facilities', label: 'Fasilitas Kamar', icon: '🛏️' },
                                                { id: 'bathroom_facilities', label: 'Fasilitas WC', icon: '🚿' },
                                                { id: 'kitchen_facilities', label: 'Fasilitas Dapur', icon: '🍳' },
                                                { id: 'public_facilities', label: 'Fasilitas Umum', icon: '🛋️' },
                                                { id: 'water_check', label: 'Pengecekan Air', icon: '💧' },
                                                { id: 'wifi_check', label: 'Pengecekan WiFi', icon: '📶' },
                                                { id: 'security_check', label: 'Pengecekan Keamanan', icon: '🛡️' },
                                                { id: 'access_check', label: 'Akses Umum/Kampus/Kantor', icon: '📍' },
                                                { id: 'building_conditions', label: 'Kondisi Bangunan/Kamar', icon: '🏠' },
                                                { id: 'environmental_conditions', label: 'Lingkungan Sekitar', icon: '🌳' },
                                            ].map((field) => (
                                                <div key={field.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm transition-all hover:border-orange-200">
                                                    <div className="mb-3">
                                                        <label className="text-[10px] font-black text-gray-800 uppercase tracking-widest flex items-center gap-1.5">
                                                            <span>{field.icon}</span> {field.label}
                                                        </label>
                                                    </div>
                                                    
                                                    {categoryChecklists[field.id] && (
                                                        <div className="mb-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                            {categoryChecklists[field.id].map(item => {
                                                                const isChecked = ((surveyForm.evaluation_summary as any)?.[`${field.id}_checklist`] || []).includes(item);
                                                                const isDekat = item.toLowerCase().startsWith('dekat');
                                                                return (
                                                                    <div key={item} className="flex flex-col gap-1.5">
                                                                       <label className={`flex items-center gap-2 p-2 rounded-lg border text-[10px] sm:text-xs transition-colors ${isChecked ? 'bg-orange-50 border-orange-200 text-orange-700 font-bold' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'} cursor-pointer`}>
                                                                           <input
                                                                               type="checkbox"
                                                                               className="w-3.5 h-3.5 text-orange-500 rounded border-gray-300 focus:ring-orange-500 cursor-pointer disabled:cursor-default"
                                                                               checked={isChecked}
                                                                               onChange={(e) => {
                                                                                   const currentList = (surveyForm.evaluation_summary as any)?.[`${field.id}_checklist`] || [];
                                                                                   const newList = e.target.checked 
                                                                                       ? [...currentList, item] 
                                                                                       : currentList.filter((i: string) => i !== item);
                                                                                   
                                                                                   setSurveyForm({ 
                                                                                       ...surveyForm, 
                                                                                       evaluation_summary: { 
                                                                                           ...(surveyForm.evaluation_summary || {}), 
                                                                                           [`${field.id}_checklist`]: newList 
                                                                                       } 
                                                                                   });
                                                                               }}
                                                                               disabled={isEditingSurvey?.status === 'COMPLETED' || isEditingSurvey?.status === 'SUBMITTED'}
                                                                           />
                                                                           <span className="truncate" title={item}>{item}</span>
                                                                       </label>
                                                                       
                                                                       {isDekat && isChecked && (
                                                                           <div className="flex flex-col gap-1 px-1">
                                                                               <div className="flex items-center gap-1">
                                                                                   <input 
                                                                                       type="number"
                                                                                       className="w-16 bg-white border border-gray-200 rounded-md px-1.5 py-1 text-[10px] font-bold outline-none focus:ring-1 focus:ring-orange-500"
                                                                                       placeholder="Angka"
                                                                                       value={(surveyForm.evaluation_summary as any)?.[`${field.id}_${item}_dist`] || ''}
                                                                                       onChange={e => setSurveyForm({
                                                                                           ...surveyForm,
                                                                                           evaluation_summary: {
                                                                                               ...(surveyForm.evaluation_summary || {}),
                                                                                               [`${field.id}_${item}_dist`]: e.target.value
                                                                                           }
                                                                                       })}
                                                                                       disabled={isEditingSurvey?.status === 'COMPLETED' || isEditingSurvey?.status === 'SUBMITTED'}
                                                                                   />
                                                                                   <select 
                                                                                       className="bg-white border border-gray-200 rounded-md px-1 py-1 text-[10px] font-bold outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
                                                                                       value={(surveyForm.evaluation_summary as any)?.[`${field.id}_${item}_unit`] || 'm'}
                                                                                       onChange={e => setSurveyForm({
                                                                                           ...surveyForm,
                                                                                           evaluation_summary: {
                                                                                               ...(surveyForm.evaluation_summary || {}),
                                                                                               [`${field.id}_${item}_unit`]: e.target.value
                                                                                           }
                                                                                       })}
                                                                                       disabled={isEditingSurvey?.status === 'COMPLETED' || isEditingSurvey?.status === 'SUBMITTED'}
                                                                                   >
                                                                                       <option value="m">m</option>
                                                                                       <option value="km">km</option>
                                                                                   </select>
                                                                               </div>
                                                                               
                                                                               {item === 'Dekat Kampus/Kantor' && (
                                                                                   <input 
                                                                                       type="text"
                                                                                       className="w-full bg-white border border-gray-200 rounded-md px-2 py-1 text-[10px] font-bold outline-none focus:ring-1 focus:ring-orange-500"
                                                                                       placeholder="Nama Kampus/Kantor..."
                                                                                       value={(surveyForm.evaluation_summary as any)?.[`${field.id}_${item}_name`] || ''}
                                                                                       onChange={e => setSurveyForm({
                                                                                           ...surveyForm,
                                                                                           evaluation_summary: {
                                                                                               ...(surveyForm.evaluation_summary || {}),
                                                                                               [`${field.id}_${item}_name`]: e.target.value
                                                                                           }
                                                                                       })}
                                                                                       disabled={isEditingSurvey?.status === 'COMPLETED' || isEditingSurvey?.status === 'SUBMITTED'}
                                                                                   />
                                                                               )}
                                                                           </div>
                                                                       )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}

                                                    {field.id === 'wifi_check' && (
                                                        <div className="mb-3">
                                                            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus-within:ring-2 focus-within:ring-orange-500 transition-all">
                                                                <input 
                                                                    type="number"
                                                                    className="flex-1 bg-transparent text-sm font-bold outline-none text-gray-700"
                                                                    placeholder="Ketik kecepatan internet..."
                                                                    value={(surveyForm.evaluation_summary as any)?.wifi_speed || ''}
                                                                    onChange={e => setSurveyForm({
                                                                        ...surveyForm,
                                                                        evaluation_summary: {
                                                                            ...(surveyForm.evaluation_summary || {}),
                                                                            wifi_speed: e.target.value
                                                                        }
                                                                    })}
                                                                    disabled={isEditingSurvey?.status === 'COMPLETED' || isEditingSurvey?.status === 'SUBMITTED'}
                                                                />
                                                                <span className="text-xs font-black text-gray-400 tracking-widest">MBPS</span>
                                                            </div>
                                                        </div>
                                                    )}

                                                     {field.id !== 'kost_type' && (
                                                         <>
                                                    <div className="mb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-t border-gray-100 pt-3">
                                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Penilaian Keseluruhan</label>
                                                        <StarRatingInput 
                                                            value={(surveyForm.evaluation_summary as any)?.[`${field.id}_rating`] || 0}
                                                            onChange={(val) => {
                                                                setSurveyForm({ 
                                                                    ...surveyForm, 
                                                                    evaluation_summary: { 
                                                                        ...(surveyForm.evaluation_summary || {}), 
                                                                        [`${field.id}_rating`]: val 
                                                                    } 
                                                                });
                                                            }}
                                                            disabled={isEditingSurvey?.status === 'COMPLETED' || isEditingSurvey?.status === 'SUBMITTED'}
                                                        />
                                                    </div>

                                                    <textarea 
                                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-orange-500 transition-all outline-none mb-3 disabled:bg-gray-100 disabled:opacity-80"
                                                        rows={2}
                                                        value={(surveyForm.evaluation_summary as any)?.[field.id] || ''}
                                                        onChange={e => {
                                                            setSurveyForm({ 
                                                                ...surveyForm, 
                                                                evaluation_summary: { 
                                                                    ...(surveyForm.evaluation_summary || {}), 
                                                                    [field.id]: e.target.value 
                                                                } 
                                                            });
                                                        }}
                                                        disabled={isEditingSurvey?.status === 'COMPLETED' || isEditingSurvey?.status === 'SUBMITTED'}
                                                        placeholder={`Tulis hasil pengecekan ${field.label.toLowerCase()}...`}
                                                    />
                                                    
                                                    {/* Photo Upload Section */}
                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[9px] font-black text-gray-700 uppercase tracking-widest">Bukti Foto</span>
                                                            {(isEditingSurvey?.status !== 'COMPLETED' && isEditingSurvey?.status !== 'SUBMITTED') && (
                                                                <button 
                                                                                type="button"
                                                                                onClick={() => setUploadSourceFieldId(field.id)}
                                                                                disabled={isUploadingSurveyPhoto === field.id}
                                                                                className={`text-[9px] font-black uppercase px-2.5 py-1.5 rounded-lg bg-orange-50 text-orange-600 transition-colors flex items-center gap-1.5 cursor-pointer hover:bg-orange-100 ${isUploadingSurveyPhoto === field.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                            >
                                                                                {isUploadingSurveyPhoto === field.id ? (
                                                                                    <>
                                                                                        <div className="w-3 h-3 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                                                                                        Uploading...
                                                                                    </>
                                                                                ) : (
                                                                                    <>
                                                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                                                                                        Tambah Foto
                                                                                    </>
                                                                                )}
                                                                            </button>
                                                            )}
                                                        </div>
                                                        
                                                        {/* Photo Preview Grid */}
                                                        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                                                            {((surveyForm.evaluation_summary as any)?.[`${field.id}_photos`] || []).map((url: string, idx: number) => (
                                                                <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-gray-100 group shadow-sm bg-gray-50">
                                                                    <img src={url} alt="Proof" className="w-full h-full object-cover cursor-zoom-in" onClick={() => window.open(url, '_blank')} />
                                                                    {(isEditingSurvey?.status !== 'COMPLETED' && isEditingSurvey?.status !== 'SUBMITTED') && (
                                                                        <button 
                                                                            type="button"
                                                                            onClick={() => handleRemoveSurveyPhoto(field.id, url)}
                                                                            className="absolute inset-0 bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-[2px]"
                                                                        >
                                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                         </>
                                                     )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-gray-100">
                                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200">
                                            <div className="flex justify-between items-center mb-1.5">
                                                <label className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Link Hasil Survey (Foto & Video)</label>
                                                {surveyForm.result_drive_link && (
                                                    <button 
                                                        type="button" 
                                                        onClick={() => window.open(surveyForm.result_drive_link, '_blank')}
                                                        className="text-[10px] font-black text-gray-700 hover:text-gray-900 flex items-center gap-1 uppercase tracking-widest bg-white px-2 py-1 rounded-md border border-gray-200 shadow-sm transition-all active:scale-95"
                                                    >
                                                        <span>📁</span> Buka Folder
                                                    </button>
                                                )}
                                            </div>
                                            <input 
                                                readOnly
                                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs font-bold text-gray-600 cursor-not-allowed outline-none"
                                                value={surveyForm.result_drive_link || ''}
                                                placeholder="Sistem belum membuat folder drive..."
                                            />
                                            <p className="text-[9px] text-gray-500 mt-2 font-medium italic">
                                                {surveyForm.result_drive_link 
                                                    ? "✓ Folder Drive otomatis telah berhasil dibuat. Upload video pengecekan ke dalam folder tersebut." 
                                                    : "ℹ Folder akan dibuat otomatis oleh sistem saat survey berhasil."}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4 p-6 border-t border-gray-100 sticky bottom-0 bg-white shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
                                    <button 
                                        type="button"
                                        onClick={() => setIsEditingSurvey(null)}
                                        className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                                    >
                                        Batal/Tutup
                                    </button>
                                    {(isEditingSurvey?.status !== 'COMPLETED' && isEditingSurvey?.status !== 'SUBMITTED') && (
                                        <button 
                                            type="submit" 
                                            disabled={isSubmitting}
                                            className="flex-[2] py-3.5 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-300 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                                        >
                                            {isSubmitting ? 'Mengirim...' : 'Kirim Laporan'}
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>
                )}



                {isEditingKostManager && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm" onClick={closeKostManagerListingWithSave}></div>
                        <div className="bg-[#f8f9ff] text-[#0b1c30] w-full max-w-2xl rounded-3xl shadow-2xl relative z-10 flex flex-col h-[90vh] max-h-[880px] overflow-hidden animate-in zoom-in-95 font-['Plus_Jakarta_Sans']">
                            
                            {/* Warning overlay for existing property migration */}
                            {isExistingPropertyMigration && !warningAccepted && (
                                <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-[#f8f9ff]/95 backdrop-blur-sm rounded-3xl">
                                    <div className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl flex flex-col items-center gap-5 border border-orange-100">
                                        <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center">
                                            <AlertTriangle className="w-8 h-8 text-orange-500 shrink-0" />
                                        </div>
                                        <div className="text-center">
                                            <h3 className="text-lg font-extrabold text-[#0b1c30] mb-2">Peninjauan Ulang Data</h3>
                                            <p className="text-sm text-[#584235] leading-relaxed font-medium">
                                                Beberapa data secara otomatis sudah terisi, lakukan peninjauan ulang untuk memastikan kesesuaian data sudah benar.
                                            </p>
                                        </div>
                                        <div className="flex gap-3 w-full">
                                            <button
                                                type="button"
                                                onClick={closeKostManagerListingWithSave}
                                                className="flex-1 h-12 border border-gray-300 text-[#584235] rounded-full font-bold text-xs uppercase tracking-wider hover:bg-gray-50 transition-colors"
                                            >
                                                Keluar
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setWarningAccepted(true)}
                                                className="flex-[2] h-12 bg-[#ff7a00] hover:bg-orange-600 text-white rounded-full font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md"
                                            >
                                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                                Saya Mengerti
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TopAppBar header */}
                            <div className="bg-white border-b border-[#e0c0af] px-6 h-[64px] flex items-center shrink-0 justify-between">
                                <div className="flex items-center gap-3">
                                    <button 
                                        type="button"
                                        onClick={async () => {
                                            if (kmStep > 1) {
                                                setKmStep(kmStep - 1);
                                                await handleSaveDraftDirectly(kmListingForm, true);
                                            } else {
                                                await closeKostManagerListingWithSave();
                                            }
                                        }}
                                        className="text-[#584235] p-2 rounded-full hover:bg-gray-100 transition-colors active:scale-95 flex items-center justify-center"
                                    >
                                        <ArrowLeft className="w-5 h-5 shrink-0" />
                                    </button>
                                    <div>
                                        <h2 className="text-sm font-bold uppercase text-[#ff7a00] tracking-wider">Onboarding Kost</h2>
                                        <p className="text-[10px] text-[#584235] font-medium tracking-wide">Survey Field App</p>
                                    </div>
                                </div>
                                <button onClick={closeKostManagerListingWithSave} className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-full hover:bg-gray-50 transition-colors">&times;</button>
                            </div>

                            {/* Stepper Indicator with Dynamic Evaluation Glowing Badges */}
                            {(() => {
                                const currentEvalData = parseEvaluationData(isEditingKostManager?.notes, isEditingKostManager?.status);

                                return (
                                    <div className="bg-white border-b border-[#e0c0af] py-3 px-6 shrink-0 flex items-center justify-between gap-1">
                                        <button 
                                            type="button"
                                            onClick={() => setKmStep(1)}
                                            className="flex flex-col items-center gap-1 flex-1 relative cursor-pointer"
                                        >
                                            <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-sm transition-all relative ${
                                                kmStep >= 1 ? 'bg-[#ff7a00] text-white' : 'bg-[#d3e4fe] text-[#584235]'
                                            } ${currentEvalData.hasRevision && currentEvalData.hasProperty ? 'ring-4 ring-amber-400 ring-offset-1 animate-pulse' : ''}`}>
                                                1
                                            </div>
                                            <div className={`text-[9px] text-center font-bold uppercase tracking-wider flex items-center gap-1 ${
                                                kmStep >= 1 ? 'text-[#ff7a00]' : 'text-gray-400'
                                            }`}>
                                                PROPERTI
                                                {currentEvalData.hasRevision && currentEvalData.hasProperty && (
                                                    <span className="px-1.5 py-0.5 text-[8px] bg-amber-500 text-white rounded-md font-black shadow-xs animate-pulse">REVISI</span>
                                                )}
                                            </div>
                                        </button>
                                        <div className="h-px bg-[#e0c0af] w-8 shrink-0 -translate-y-3"></div>
                                        <button 
                                            type="button"
                                            onClick={() => setKmStep(2)}
                                            className="flex flex-col items-center gap-1 flex-1 relative cursor-pointer"
                                        >
                                            <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-all relative ${
                                                kmStep >= 2 ? 'bg-[#ff7a00] text-white' : 'bg-[#d3e4fe] text-[#584235]'
                                            } ${currentEvalData.hasRevision && currentEvalData.hasRoom ? 'ring-4 ring-amber-400 ring-offset-1 animate-pulse' : ''}`}>
                                                2
                                            </div>
                                            <div className={`text-[9px] text-center font-bold uppercase tracking-wider flex items-center gap-1 ${
                                                kmStep >= 2 ? 'text-[#ff7a00]' : 'text-gray-400'
                                            }`}>
                                                DATA KAMAR
                                                {currentEvalData.hasRevision && currentEvalData.hasRoom && (
                                                    <span className="px-1.5 py-0.5 text-[8px] bg-amber-500 text-white rounded-md font-black shadow-xs animate-pulse">REVISI</span>
                                                )}
                                            </div>
                                        </button>
                                        <div className="h-px bg-[#e0c0af] w-8 shrink-0 -translate-y-3"></div>
                                        <button 
                                            type="button"
                                            onClick={() => setKmStep(3)}
                                            className="flex flex-col items-center gap-1 flex-1 relative cursor-pointer"
                                        >
                                            <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-all relative ${
                                                kmStep >= 3 ? 'bg-[#ff7a00] text-white' : 'bg-[#d3e4fe] text-[#584235]'
                                            } ${currentEvalData.hasRevision && currentEvalData.hasPartner ? 'ring-4 ring-amber-400 ring-offset-1 animate-pulse' : ''}`}>
                                                3
                                            </div>
                                            <div className={`text-[9px] text-center font-bold uppercase tracking-wider flex items-center gap-1 ${
                                                kmStep >= 3 ? 'text-[#ff7a00]' : 'text-gray-400'
                                            }`}>
                                                REVIEW
                                                {currentEvalData.hasRevision && currentEvalData.hasPartner && (
                                                    <span className="px-1.5 py-0.5 text-[8px] bg-amber-500 text-white rounded-md font-black shadow-xs animate-pulse">REVISI</span>
                                                )}
                                            </div>
                                        </button>
                                    </div>
                                );
                            })()}

                            {/* Main Scrollable Form Container */}
                            <div className="flex-grow overflow-y-auto p-6 space-y-6 hide-scrollbar">
                                
                                {/* Modern Glowing Evaluation Notice Banner with Structured Chips & Quick-Jump */}
                                {(() => {
                                    const currentEvalData = parseEvaluationData(isEditingKostManager?.notes, isEditingKostManager?.status);
                                    if (isEditingKostManager?.status === 'SUBMITTED' || isEditingKostManager?.status === 'PENDING_ONBOARDING') {
                                        return (
                                            <div className="relative overflow-hidden rounded-2xl border border-emerald-300 bg-gradient-to-br from-emerald-500/[0.08] via-emerald-50 to-teal-500/[0.05] p-4 shadow-sm flex flex-col gap-2.5 backdrop-blur-sm animate-fadeIn">
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
                                                            <CheckCircle2 size={18} />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-xs font-black text-emerald-950 uppercase tracking-wider">
                                                                Data Revisi Telah Dikirim ke Admin
                                                            </h3>
                                                            <p className="text-[10px] font-bold text-emerald-700">
                                                                Status: SUBMITTED • Menunggu Verifikasi & Persetujuan Admin
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-200 text-emerald-900 border border-emerald-300 text-[9px] font-black uppercase tracking-wider">
                                                        Terkirim
                                                    </span>
                                                </div>
                                                {currentEvalData.items.length > 0 && (
                                                    <div className="text-[10px] font-semibold text-emerald-800 bg-white/70 p-2.5 rounded-xl border border-emerald-200/60">
                                                        <p className="font-bold text-emerald-900 mb-1">Riwayat Catatan yang Telah Diperbarui:</p>
                                                        <ul className="list-disc list-inside space-y-0.5 text-emerald-700">
                                                            {currentEvalData.items.map((it, idx) => (
                                                                <li key={idx}>{it}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    }
                                    if (!currentEvalData.hasRevision) return null;

                                    return (
                                        <div className="relative overflow-hidden rounded-2xl border-2 border-amber-400 bg-gradient-to-br from-amber-500/[0.08] via-orange-500/[0.03] to-amber-500/[0.08] p-4 shadow-[0_0_20px_rgba(245,158,11,0.15)] flex flex-col gap-3 backdrop-blur-sm animate-fadeIn">
                                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 animate-pulse" />
                                            
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0 animate-bounce">
                                                        <AlertTriangle size={18} />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xs font-black text-amber-950 uppercase tracking-wider">
                                                            Permintaan Revisi / Evaluasi Admin
                                                        </h3>
                                                        <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">
                                                            Catatan Masuk • {currentEvalData.date}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-200/90 text-amber-900 border border-amber-300 text-[9px] font-black uppercase tracking-wider animate-pulse">
                                                    <Sparkles size={10} className="text-amber-700" />
                                                    Revisi Aktif
                                                </span>
                                            </div>

                                            {/* Targeted Items Chips */}
                                            {currentEvalData.items.length > 0 && (
                                                <div className="flex flex-col gap-1.5 pt-1 border-t border-amber-200/50">
                                                    <span className="text-[10px] font-black text-amber-900 uppercase tracking-wider flex items-center gap-1">
                                                        <span>📌</span> Bagian yang Perlu Diperbaiki:
                                                    </span>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {currentEvalData.items.map((item, idx) => (
                                                            <span 
                                                                key={idx} 
                                                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white text-amber-950 font-extrabold text-[10px] border border-amber-200 shadow-xs"
                                                            >
                                                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping inline-block shrink-0" />
                                                                {item}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Admin Note Quote */}
                                            {currentEvalData.adminNote && (
                                                <div className="bg-white/95 rounded-xl p-3 border border-amber-200 shadow-xs flex flex-col gap-1">
                                                    <span className="text-[9px] font-black text-amber-800 uppercase tracking-wider">
                                                        📝 Pesan Catatan Admin:
                                                    </span>
                                                    <p className="text-xs text-gray-800 font-semibold leading-relaxed whitespace-pre-wrap italic">
                                                        "{currentEvalData.adminNote}"
                                                    </p>
                                                </div>
                                            )}

                                            {/* Fallback if no items nor note */}
                                            {!currentEvalData.items.length && !currentEvalData.adminNote && (
                                                <div className="bg-white/95 rounded-xl p-3 border border-amber-200 shadow-xs">
                                                    <p className="text-xs text-gray-800 font-semibold leading-relaxed">
                                                        {isEditingKostManager?.notes || 'Mohon lengkapi dan perbaiki data pendataan yang belum sesuai.'}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Quick Jump Buttons */}
                                            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-amber-200/60">
                                                <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider">Loncat Cepat ke Bagian:</span>
                                                {currentEvalData.hasProperty && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setKmStep(1)}
                                                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 ${
                                                            kmStep === 1 ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md' : 'bg-white text-amber-900 border border-amber-300 hover:bg-amber-100'
                                                        }`}
                                                    >
                                                        🏢 Step 1 (Properti) {kmStep === 1 && '✓'}
                                                    </button>
                                                )}
                                                {currentEvalData.hasRoom && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setKmStep(2)}
                                                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 ${
                                                            kmStep === 2 ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md' : 'bg-white text-amber-900 border border-amber-300 hover:bg-amber-100'
                                                        }`}
                                                    >
                                                        🛏️ Step 2 (Data Kamar) {kmStep === 2 && '✓'}
                                                    </button>
                                                )}
                                                {currentEvalData.hasPartner && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setKmStep(3)}
                                                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 ${
                                                            kmStep === 3 ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md' : 'bg-white text-amber-900 border border-amber-300 hover:bg-amber-100'
                                                        }`}
                                                    >
                                                        📋 Step 3 (Mitra &amp; Rekening) {kmStep === 3 && '✓'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* STEP 1: PROPERTI */}
                                {kmStep === 1 && (() => {
                                    const currentEvalData = parseEvaluationData(isEditingKostManager?.notes, isEditingKostManager?.status);

                                    return (
                                        <div className="space-y-6">
                                            <section className={`rounded-2xl p-5 flex flex-col gap-4 shadow-sm transition-all relative ${
                                                currentEvalData.hasRevision && currentEvalData.facade
                                                    ? 'border-2 border-amber-400 ring-4 ring-amber-400/30 shadow-[0_0_25px_rgba(245,158,11,0.25)] bg-gradient-to-br from-amber-500/[0.04] via-white to-orange-500/[0.02] animate-pulse'
                                                    : 'border border-[#e0c0af] bg-white'
                                            }`}>
                                                {currentEvalData.hasRevision && currentEvalData.facade && (
                                                    <div className="absolute -top-3 right-4 z-10 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-[10px] uppercase tracking-wider shadow-md shadow-amber-500/30 animate-bounce">
                                                        <Sparkles size={12} />
                                                        <span>⚠️ Perlu Revisi: Profil / Info Kost</span>
                                                    </div>
                                                )}
                                                <h3 className="font-bold text-sm text-[#0b1c30] border-b border-gray-100 pb-2">Profil & Kontak Properti</h3>
                                                
                                                <div className="flex flex-col gap-1.5">
                                                    <label className="text-[11px] font-bold text-[#584235] uppercase tracking-wider">Nama Properti Kos</label>
                                                    <input 
                                                        type="text"
                                                        value={kmListingForm.title}
                                                        onChange={e => setKmListingForm({ ...kmListingForm, title: e.target.value })}
                                                        placeholder="Contoh: Kos Buana Raya"
                                                        className="w-full h-[46px] px-3.5 border border-[#8c7263] rounded-xl bg-[#f8f9ff] focus:ring-2 focus:ring-[#ff7a00] focus:border-[#ff7a00] outline-none text-sm font-semibold"
                                                    />
                                                </div>

                                                <div className="flex flex-col gap-1.5">
                                                    <label className="text-[11px] font-bold text-[#584235] uppercase tracking-wider">Tipe Kos</label>
                                                    <div className="flex bg-[#e5eeff] rounded-xl p-1 gap-1">
                                                        {['Putra', 'Putri', 'Campur'].map(t => (
                                                            <button
                                                                key={t}
                                                                type="button"
                                                                onClick={() => setKmListingForm({ ...kmListingForm, type: t })}
                                                                className={`flex-1 h-[36px] rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${kmListingForm.type === t ? 'bg-[#ff7a00] text-white shadow-sm' : 'text-[#584235] hover:bg-[#dce9ff]'}`}
                                                            >
                                                                {t}
                                                            </button>
                                                        ))}
                                                    </div>
                                                 <div className="flex flex-col gap-1.5">
                                                     <label className="text-[11px] font-bold text-[#584235] uppercase tracking-wider">Total Jumlah Kamar</label>
                                                     <input 
                                                         type="number"
                                                         min="1"
                                                         value={kmListingForm.totalRooms || ''}
                                                         onChange={e => setKmListingForm({ ...kmListingForm, totalRooms: e.target.value === '' ? '' : (parseInt(e.target.value) || 0) })}
                                                         placeholder="Masukkan total jumlah kamar (contoh: 10)"
                                                         className="w-full h-[46px] px-3.5 border border-[#8c7263] rounded-xl bg-[#f8f9ff] focus:ring-2 focus:ring-[#ff7a00] focus:border-[#ff7a00] outline-none text-sm font-semibold"
                                                     />
                                                 </div>
                                                </div>

                                                <div className="flex flex-col gap-1.5">
                                                    <label className="text-[11px] font-bold text-[#584235] uppercase tracking-wider">Alamat Lengkap Real Bangunan</label>
                                                    <textarea
                                                        value={kmListingForm.address}
                                                        onChange={e => setKmListingForm({ ...kmListingForm, address: e.target.value })}
                                                        placeholder="Jalan, Nomor Rumah, RT/RW, Kelurahan, Patokan..."
                                                        className="w-full p-3.5 border border-[#8c7263] rounded-xl bg-[#f8f9ff] focus:ring-2 focus:ring-[#ff7a00] focus:border-[#ff7a00] outline-none text-sm font-medium min-h-[75px] resize-none"
                                                    />
                                                </div>

                                                {/* 3 Kotak Input Kategori Wilayah Terstruktur (Auto-Filled dari Geocoding & Editable) */}
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                                    <div className="flex flex-col gap-1">
                                                        <label className="text-[10px] font-bold text-[#584235] uppercase tracking-wider flex items-center gap-1">
                                                            🏛️ Provinsi
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={kmListingForm.province || ''}
                                                            onChange={e => setKmListingForm({ ...kmListingForm, province: e.target.value })}
                                                            placeholder="Provinsi (Otomatis)"
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
                                                            placeholder="Kota / Kab (Otomatis)"
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
                                                            placeholder="Kecamatan (Otomatis)"
                                                            className="w-full h-[42px] px-3 border border-[#8c7263] rounded-xl bg-[#f8f9ff] focus:ring-2 focus:ring-[#ff7a00] focus:border-[#ff7a00] outline-none text-xs font-bold text-slate-800"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex flex-col gap-1.5">
                                                    <label className="text-[11px] font-bold text-[#584235] uppercase tracking-wider">Lokasi GPS</label>

                                                    <div className={`rounded-xl overflow-hidden flex flex-col relative transition-all ${
                                                        currentEvalData.hasRevision && currentEvalData.gps
                                                            ? 'border-2 border-amber-400 ring-4 ring-amber-400/30 shadow-[0_0_25px_rgba(245,158,11,0.25)] bg-gradient-to-br from-amber-500/[0.04] via-white to-orange-500/[0.02] animate-pulse'
                                                            : 'border border-[#e0c0af] bg-[#f8f9ff]'
                                                    }`}>
                                                        {currentEvalData.hasRevision && currentEvalData.gps && (
                                                            <div className="absolute top-2 left-2 z-20 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-[9px] uppercase tracking-wider shadow-md shadow-amber-500/30 animate-bounce">
                                                                <Sparkles size={11} />
                                                                <span>⚠️ Perlu Revisi: Titik Koordinat GPS</span>
                                                            </div>
                                                        )}
                                                        <div ref={kmMapRef} className="w-full h-40 z-0 relative" style={{ minHeight: '160px', touchAction: 'none' }} />
                                                        
                                                        {/* Floating Quick Action Button on Mini Map */}
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setModalTempLocation(kmListingForm.location || { lat: -5.147665, lng: 119.432731 });
                                                                setIsMapModalOpen(true);
                                                            }}
                                                            className="absolute top-2 right-2 z-10 bg-white/95 backdrop-blur-sm hover:bg-white text-gray-800 text-[10px] font-black px-2.5 py-1.5 rounded-lg border border-gray-200 shadow-md flex items-center gap-1 transition-all active:scale-95"
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
                                                                if (confirmLocationChange()) {
                                                                    if (navigator.geolocation) {
                                                                        navigator.geolocation.getCurrentPosition((pos) => {
                                                                            const plat = pos.coords.latitude;
                                                                            const plng = pos.coords.longitude;
                                                                            reverseGeocodeAndApply(plat, plng);
                                                                            alert('Koordinat properti presisi berhasil dikunci & wilayah terdeteksi!');
                                                                        }, err => alert('Gagal membaca GPS: ' + err.message));
                                                                    }
                                                                }
                                                            }}
                                                            className="w-full h-[46px] bg-[#e5eeff] hover:bg-[#dce9ff] text-[#ff7a00] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors border-t border-[#e0c0af]"
                                                        >
                                                            <LocateFixed className="w-4 h-4 shrink-0" />
                                                            Gunakan Lokasi Saya Saat Ini
                                                        </button>
                                                    </div>
                                                </div>

                                            {/* Fullscreen Map Picker Pop-up Modal */}
                                            {isMapModalOpen && (
                                                <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-md flex flex-col justify-center items-center p-2 sm:p-4 md:p-6 animate-fadeIn">
                                                    <div className="bg-white w-full max-w-4xl h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-100 relative">
                                                        
                                                        {/* Modal Header */}
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
                                                                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors"
                                                            >
                                                                <X className="w-4 h-4 shrink-0" />
                                                            </button>
                                                        </div>

                                                        {/* Modal Search Bar & Quick GPS */}
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
                                                                
                                                                {/* Modal Search Dropdown */}
                                                                {(isSearchingModalMap || modalSearchResults.length > 0) && (
                                                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-xl z-50 overflow-hidden max-h-52 overflow-y-auto divide-y divide-gray-50">
                                                                        {isSearchingModalMap ? (
                                                                            <p className="p-3 text-xs font-bold text-gray-400 flex items-center gap-2">
                                                                                <RefreshCw className="w-4 h-4 animate-spin shrink-0" /> Mencari lokasi...
                                                                            </p>
                                                                        ) : (
                                                                            modalSearchResults.map((r: any, i: number) => (
                                                                                <button
                                                                                    key={r.place_id || i}
                                                                                    type="button"
                                                                                    onClick={() => selectModalSearchResult(r)}
                                                                                    className="w-full p-2.5 text-left text-xs font-medium text-gray-700 hover:bg-orange-50 transition-colors flex items-start gap-2"
                                                                                >
                                                                                    <MapPin className="w-3.5 h-3.5 text-orange-500 mt-0.5 shrink-0" />
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
                                                                className="h-10 px-3.5 bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shrink-0 whitespace-nowrap"
                                                            >
                                                                <LocateFixed className="w-4 h-4 shrink-0" />
                                                                Lokasi GPS Saya
                                                            </button>
                                                        </div>

                                                        {/* Modal Map Viewport */}
                                                        <div className="relative flex-1 w-full bg-gray-100">
                                                            <div ref={modalMapRef} className="w-full h-full" />

                                                            {/* Floating Coordinate Readout */}
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

                                                        {/* Modal Footer Actions */}
                                                        <div className="bg-white border-t border-gray-100 p-3.5 sm:px-6 flex items-center justify-end gap-3 shrink-0">
                                                            <button
                                                                type="button"
                                                                onClick={() => setIsMapModalOpen(false)}
                                                                className="px-5 py-2.5 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                                                            >
                                                                Batal
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={handleConfirmModalLocation}
                                                                className="px-6 py-2.5 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-xl shadow-lg shadow-orange-500/20 transition-all flex items-center gap-1.5 active:scale-95"
                                                            >
                                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                                                Kunci & Gunakan Lokasi Ini
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            <div className={`rounded-2xl p-4 flex flex-col gap-3 relative transition-all ${
                                                currentEvalData.hasRevision && currentEvalData.landmark
                                                    ? 'border-2 border-amber-400 ring-4 ring-amber-400/30 shadow-[0_0_25px_rgba(245,158,11,0.25)] bg-gradient-to-br from-amber-500/[0.04] via-[#f8f9ff] to-orange-500/[0.02] animate-pulse'
                                                    : 'border border-gray-200 bg-[#f8f9ff]'
                                            }`}>
                                                {currentEvalData.hasRevision && currentEvalData.landmark && (
                                                    <div className="absolute -top-3 right-4 z-10 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-[10px] uppercase tracking-wider shadow-md shadow-amber-500/30 animate-bounce">
                                                        <Sparkles size={12} />
                                                        <span>⚠️ Perlu Revisi: Landmark / Kampus</span>
                                                    </div>
                                                )}
                                                <div className="flex items-center justify-between">
                                                    <h4 className="font-black text-xs text-[#0b1c30] uppercase tracking-wider">Fasilitas &amp; Landmark Terdekat</h4>
                                                    <span className="text-[10px] font-bold text-gray-400">
                                                        {(kmListingForm.campuses || []).length} Terpilih
                                                    </span>
                                                </div>

                                                <div className="space-y-3">
                                                    {isScanningLandmarks && (
                                                        <div className="flex items-center gap-2.5 px-4 py-3 bg-amber-50 border border-amber-200/80 rounded-2xl text-amber-800 text-xs font-bold animate-pulse">
                                                            <Loader2 size={16} className="text-amber-500 animate-spin shrink-0" />
                                                            <span>Memindai kampus, rumah sakit, mall, minimarket, &amp; fasilitas harian terdekat dari Google Maps...</span>
                                                        </div>
                                                    )}

                                                    {(kmListingForm.campuses || []).filter((c: any) => !isGarbageFacility(c.name)).map((c: any, i: number) => {
                                                        const walk = c.walkDuration || (() => {
                                                            const kmMatch = (c.distance || '').match(/[\d.]+/);
                                                            return kmMatch ? `${Math.ceil((parseFloat(kmMatch[0]) / 4.2) * 60)} Mnt` : '5 Mnt';
                                                        })();
                                                        const moto = c.motoDuration || (() => {
                                                            const kmMatch = (c.distance || '').match(/[\d.]+/);
                                                            return kmMatch ? `${Math.ceil((parseFloat(kmMatch[0]) / 28) * 60) + 1} Mnt` : '2 Mnt';
                                                        })();
                                                        const car = c.carDuration || (() => {
                                                            const kmMatch = (c.distance || '').match(/[\d.]+/);
                                                            return kmMatch ? `${Math.ceil((parseFloat(kmMatch[0]) / 18) * 60) + 2} Mnt` : '4 Mnt';
                                                        })();

                                                        const getCategoryIcon = (cat?: string, name?: string) => {
                                                            const n = (name || '').toLowerCase();
                                                            const cStr = (cat || '').toLowerCase();
                                                            if (cStr === 'campus' || n.includes('universitas') || n.includes('kampus') || n.includes('politeknik') || n.includes('institut') || n.includes('sekolah tinggi')) return '🎓';
                                                            if (cStr === 'hospital' || n.includes('rs ') || n.includes('rumah sakit') || n.includes('rsud') || n.includes('rsup')) return '🏥';
                                                            if (cStr === 'mall' || n.includes('mall') || n.includes('square') || n.includes('plaza')) return '🛍️';
                                                            if (cStr === 'minimarket' || n.includes('indomaret') || n.includes('alfamart') || n.includes('alfamidi') || n.includes('circle k') || n.includes('mart')) return '🛒';
                                                            if (cStr === 'laundry' || n.includes('laundry') || n.includes('cuci')) return '🧺';
                                                            if (cStr === 'mosque' || n.includes('masjid') || n.includes('musholla') || n.includes('mushola')) return '🕌';
                                                            if (cStr === 'church' || n.includes('gereja') || n.includes('katedral')) return '⛪';
                                                            if (cStr === 'gas_station' || n.includes('spbu') || n.includes('pertamina') || n.includes('bensin')) return '⛽';
                                                            if (cStr === 'office' || cStr === 'industrial' || n.includes('cbd') || n.includes('industri') || n.includes('perkantoran')) return '🏢';
                                                            if (cStr === 'transport' || n.includes('bandara') || n.includes('terminal') || n.includes('pelabuhan') || n.includes('stasiun')) return '🚆';
                                                            return '📍';
                                                        };

                                                        return (
                                                            <div key={i} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center bg-white p-3 rounded-2xl border border-gray-150 transition-all hover:border-orange-300 shadow-xs">
                                                                <div className="flex-1 space-y-2 w-full">
                                                                    <div className="flex gap-2 w-full">
                                                                        <div className="relative flex-1">
                                                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm select-none">
                                                                                {getCategoryIcon(c.category, c.name)}
                                                                            </span>
                                                                            <input 
                                                                                placeholder="Nama kampus/landmark (Cth: UNHAS / RS Wahidin / Indomaret)" 
                                                                                value={c.name}
                                                                                onChange={e => { 
                                                                                    const a = [...(kmListingForm.campuses || [])]; 
                                                                                    const targetIdx = a.findIndex(item => item === c);
                                                                                    if (targetIdx !== -1) {
                                                                                        a[targetIdx] = { ...a[targetIdx], name: e.target.value };
                                                                                        setKmListingForm((prev: any) => ({ ...prev, campuses: a }));
                                                                                    }
                                                                                }} 
                                                                                className="w-full h-[38px] pl-9 pr-3 border border-gray-200 rounded-xl bg-gray-50/50 text-xs font-bold text-gray-800 outline-none focus:border-orange-500 focus:bg-white transition-all"
                                                                            />
                                                                        </div>
                                                                        <button 
                                                                            type="button" 
                                                                            onClick={() => {
                                                                                const targetIdx = (kmListingForm.campuses || []).findIndex((item: any) => item === c);
                                                                                if (targetIdx !== -1) searchFacilityCoordinates(targetIdx, c.name);
                                                                            }}
                                                                            disabled={isSearchingFacility[`campuses-${i}`]}
                                                                            className="bg-orange-500 text-white px-3.5 h-[38px] rounded-xl text-xs font-bold shrink-0 hover:bg-orange-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                                                                        >
                                                                            {isSearchingFacility[`campuses-${i}`] ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                                                                            <span>{isSearchingFacility[`campuses-${i}`] ? 'Mencari...' : 'Cari'}</span>
                                                                        </button>
                                                                    </div>

                                                                    <div className="flex flex-wrap items-center justify-between gap-2 bg-gray-50/80 px-3 py-1.5 rounded-xl border border-gray-100 w-full shadow-2xs">
                                                                        <div className="flex items-center gap-1.5">
                                                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Rute Terverifikasi:</span>
                                                                            {c.isLiveGoogleApi && (
                                                                                <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-black rounded-md border border-emerald-200/60 uppercase tracking-tight">
                                                                                    Live Rute
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <div className="flex items-center gap-2.5 text-[11px] font-bold text-gray-700">
                                                                            <span className="flex items-center gap-1" title="Jalan Kaki">🚶 {walk}</span>
                                                                            <span className="text-gray-300">•</span>
                                                                            <span className="flex items-center gap-1" title="Sepeda Motor">🏍️ {moto}</span>
                                                                            <span className="text-gray-300">•</span>
                                                                            <span className="flex items-center gap-1" title="Mobil">🚗 {car}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                                                                    <input 
                                                                        placeholder="Jarak" 
                                                                        value={c.distance || ''}
                                                                        onChange={e => { 
                                                                            const a = [...(kmListingForm.campuses || [])]; 
                                                                            const targetIdx = a.findIndex((item: any) => item === c);
                                                                            if (targetIdx !== -1) {
                                                                                a[targetIdx] = { ...a[targetIdx], distance: e.target.value };
                                                                                setKmListingForm((prev: any) => ({ ...prev, campuses: a }));
                                                                            }
                                                                        }} 
                                                                        className="w-20 sm:w-24 h-[38px] px-2.5 border border-gray-200 rounded-xl bg-gray-50 text-xs font-bold text-center text-gray-700 outline-none focus:border-orange-500 focus:bg-white transition-all" 
                                                                    />
                                                                    <button 
                                                                        type="button" 
                                                                        onClick={() => setKmListingForm((prev: any) => ({ ...prev, campuses: (prev.campuses || []).filter((item: any) => item !== c) }))}
                                                                        className="h-[38px] w-[38px] text-rose-500 hover:bg-rose-50 border border-rose-100 rounded-xl shrink-0 flex items-center justify-center transition-colors cursor-pointer"
                                                                        title="Hapus Landmark Ini"
                                                                    >
                                                                        <Trash2 size={16}/>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}

                                                    <div className="flex flex-col sm:flex-row gap-2 pt-2">
                                                        <button 
                                                            type="button"
                                                            onClick={() => {
                                                                setShowAddLandmarkForm(true);
                                                                setLandmarkLocation(kmListingForm.location || { lat: -5.147665, lng: 119.432731 });
                                                            }}
                                                            className="flex-1 h-10 border-2 border-dashed border-orange-200 bg-orange-50/30 hover:bg-orange-50 text-orange-600 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                                                        >
                                                            <Plus size={15} /> + Tambah Landmark / Kampus Manual
                                                        </button>

                                                        {kmListingForm.location?.lat && kmListingForm.location?.lng && (
                                                            <button 
                                                                type="button"
                                                                onClick={() => detectNearbyLandmarks(kmListingForm.location.lat, kmListingForm.location.lng)}
                                                                disabled={isScanningLandmarks}
                                                                className="h-10 px-4 bg-orange-500 hover:bg-orange-600 active:scale-98 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50 shadow-xs cursor-pointer"
                                                            >
                                                                <Sparkles size={14} className={isScanningLandmarks ? "animate-spin" : ""} />
                                                                <span>{isScanningLandmarks ? 'Memindai...' : '✨ Pindai Ulang Landmark'}</span>
                                                            </button>
                                                        )}
                                                    </div>

                                                    {/* Form Tambah Landmark Manual (Modal / Dropdown) */}
                                                    {showAddLandmarkForm && (
                                                        <div className="flex flex-col gap-3 bg-[#fdfdfd] p-3 rounded-2xl border border-orange-200 shadow-sm mt-2">
                                                            <div className="flex justify-between items-center mb-0.5">
                                                                <span className="text-[10px] font-bold text-[#584235] uppercase tracking-wider">Form Tambah Landmark Manual</span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setNewLandmarkName('');
                                                                        setGoogleMapsUrlInput('');
                                                                        setShowAddLandmarkForm(false);
                                                                    }}
                                                                    className="text-gray-450 hover:text-gray-650 text-xs font-bold"
                                                                >
                                                                    Batal
                                                                </button>
                                                            </div>

                                                            {/* Choice Selection Tabs */}
                                                            <div className="flex bg-gray-100 p-0.5 rounded-xl border border-gray-200">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setLandmarkInputMethod('search')}
                                                                    className={`flex-1 py-2 text-[10px] font-extrabold uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-1 ${landmarkInputMethod === 'search' ? 'bg-[#ff7a00] text-white shadow-md' : 'text-[#584235] hover:text-orange-600 hover:bg-gray-200/50'}`}
                                                                >
                                                                    <Search className="w-3 h-3 shrink-0" />
                                                                    Cari Nama Lokasi
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setLandmarkInputMethod('gmaps')}
                                                                    className={`flex-1 py-2 text-[10px] font-extrabold uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-1 ${landmarkInputMethod === 'gmaps' ? 'bg-[#ff7a00] text-white shadow-md' : 'text-[#584235] hover:text-orange-600 hover:bg-gray-200/50'}`}
                                                                >
                                                                    <LinkIcon className="w-3 h-3 shrink-0" />
                                                                    Konversi Link GMaps
                                                                </button>
                                                            </div>

                                                            {/* Conditional Input Methods */}
                                                            {landmarkInputMethod === 'search' ? (
                                                                <div className="flex flex-col gap-1 w-full relative">
                                                                    <div className="flex gap-2 w-full">
                                                                        <input 
                                                                            type="text"
                                                                            placeholder="Nama Landmark (misal: Universitas Hasanuddin)"
                                                                            value={newLandmarkName}
                                                                            onChange={e => {
                                                                                setNewLandmarkName(e.target.value);
                                                                                const gw = (window as any).google;
                                                                                if (gw?.maps?.places?.AutocompleteService) {
                                                                                    const service = new gw.maps.places.AutocompleteService();
                                                                                    service.getPlacePredictions({ input: e.target.value, componentRestrictions: { country: 'ID' } }, (preds: any) => {
                                                                                        setLandmarkSuggestions(preds || []);
                                                                                    });
                                                                                }
                                                                            }}
                                                                            className="flex-1 h-[38px] px-3 border border-gray-200 rounded-xl text-xs bg-white font-bold outline-none text-[#584235] focus:border-orange-500"
                                                                        />
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                if (!newLandmarkName.trim()) {
                                                                                    alert('Ketik nama landmark / bangunan yang dicari terlebih dahulu');
                                                                                    return;
                                                                                }
                                                                                const gw = (window as any).google;
                                                                                if (!gw?.maps?.Geocoder) {
                                                                                    alert('Google Maps belum siap. Coba beberapa saat lagi.');
                                                                                    return;
                                                                                }
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
                                                                                            alert('Lokasi tidak ditemukan. Coba nama yang lebih spesifik atau gunakan tab "Konversi Link GMaps".');
                                                                                        }
                                                                                    }
                                                                                );
                                                                            }}
                                                                            className="bg-orange-50 hover:bg-orange-100 text-orange-600 font-bold text-xs uppercase px-4 rounded-xl border border-orange-200 transition-colors"
                                                                        >
                                                                            Cari
                                                                        </button>
                                                                    </div>
                                                                    
                                                                    {/* Floating Autocomplete Suggestions */}
                                                                    {landmarkSuggestions.length > 0 && (
                                                                        <div className="absolute top-[42px] left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-xl z-[9999] max-h-48 overflow-y-auto divide-y divide-gray-100">
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
                                                                                    className="p-2.5 text-[11px] text-gray-700 font-medium hover:bg-orange-50 cursor-pointer transition-colors text-left truncate"
                                                                                    title={suggestion.description}
                                                                                >
                                                                                    📍 {suggestion.description || suggestion.structured_formatting?.main_text}
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <div className="flex flex-col gap-2 w-full">
                                                                    {/* GMaps URL Input */}
                                                                    <div className="flex flex-col gap-1">
                                                                        <span className="text-[9px] font-bold text-[#584235] uppercase tracking-wider">Konversi Link Google Maps / Koordinat:</span>
                                                                        <div className="flex gap-2">
                                                                            <input 
                                                                                type="text"
                                                                                placeholder="Tempel link Google Maps / koordinat raw"
                                                                                value={googleMapsUrlInput}
                                                                                onChange={e => {
                                                                                    setGoogleMapsUrlInput(e.target.value);
                                                                                    const parsed = parseGoogleMapsUrl(e.target.value);
                                                                                    if (parsed) {
                                                                                        setLandmarkLocation(parsed);
                                                                                        if (parsed.name) {
                                                                                            setNewLandmarkName(parsed.name);
                                                                                        }
                                                                                    }
                                                                                }}
                                                                                className="flex-1 h-[38px] px-3 border border-gray-200 rounded-xl text-xs bg-white outline-none focus:border-orange-500"
                                                                            />
                                                                            <button
                                                                                type="button"
                                                                                onClick={async () => {
                                                                                    const parsed = parseGoogleMapsUrl(googleMapsUrlInput);
                                                                                    if (parsed) {
                                                                                        setLandmarkLocation(parsed);
                                                                                        if (parsed.name) {
                                                                                            setNewLandmarkName(parsed.name);
                                                                                        }
                                                                                        alert('Berhasil mengonversi koordinat dari input!');
                                                                                    } else if (googleMapsUrlInput.includes('maps.app.goo.gl') || googleMapsUrlInput.includes('goo.gl')) {
                                                                                        alert('Mengonversi short link Google Maps... Silakan tunggu sebentar.');
                                                                                        const shortParsed = await parseShortLinkCoordinates(googleMapsUrlInput);
                                                                                        if (shortParsed) {
                                                                                            setLandmarkLocation(shortParsed);
                                                                                            if (shortParsed.name) {
                                                                                                setNewLandmarkName(shortParsed.name);
                                                                                            }
                                                                                            alert('Berhasil mengonversi koordinat dari short link maps!');
                                                                                        } else {
                                                                                            alert('Gagal mengonversi short link. Pastikan link maps valid dan aktif.');
                                                                                        }
                                                                                    } else {
                                                                                        alert('Format tidak dikenali atau koordinat tidak ditemukan.');
                                                                                    }
                                                                                }}
                                                                                className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs uppercase px-4 rounded-xl border border-blue-200 transition-colors"
                                                                            >
                                                                                Konversi
                                                                            </button>
                                                                        </div>
                                                                    </div>

                                                                    {/* Extracted Landmark Name Review */}
                                                                    <div className="flex flex-col gap-1">
                                                                        <span className="text-[9px] font-bold text-[#584235] uppercase tracking-wider">Nama Landmark (Hasil Konversi / Edit):</span>
                                                                        <input 
                                                                            type="text"
                                                                            placeholder="Nama bangunan hasil konversi"
                                                                            value={newLandmarkName}
                                                                            onChange={e => setNewLandmarkName(e.target.value)}
                                                                            className="w-full h-[38px] px-3 border border-gray-200 rounded-xl text-xs bg-white font-bold outline-none text-[#584235] focus:border-orange-500"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Map Preview and Location Coordinates */}
                                                            <div className="flex flex-col gap-1 w-full mt-1">
                                                                <span className="text-[9px] font-bold text-[#584235] uppercase tracking-wider">Tentukan Lokasi Landmark di Peta:</span>
                                                                <div ref={kmLandmarkMapRef} className="w-full h-32 z-0 relative rounded-xl border border-gray-200" style={{ minHeight: '120px' }} />
                                                                <p className="text-[9px] text-gray-500 font-mono mt-1 bg-gray-50 px-2 py-0.5 rounded border border-gray-200 self-end">
                                                                    Lat: {landmarkLocation.lat.toFixed(6)}, Lng: {landmarkLocation.lng.toFixed(6)}
                                                                </p>
                                                            </div>
                                                            <div className="flex gap-2 mt-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        if (!newLandmarkName.trim()) {
                                                                            alert('Silakan isi nama landmark terlebih dahulu.');
                                                                            return;
                                                                        }
                                                                        const newLm = { name: newLandmarkName.trim(), lat: landmarkLocation.lat, lng: landmarkLocation.lng };
                                                                        setKmListingForm({
                                                                            ...kmListingForm,
                                                                            campuses: [
                                                                                ...(kmListingForm.campuses || []),
                                                                                newLm
                                                                            ]
                                                                        });
                                                                        if (kmListingForm.location?.lat && kmListingForm.location?.lng) {
                                                                            enrichLandmarksWithGoogleDistanceMatrix(kmListingForm.location.lat, kmListingForm.location.lng, [newLm]);
                                                                        }
                                                                        setNewLandmarkName('');
                                                                        setGoogleMapsUrlInput('');
                                                                        setShowAddLandmarkForm(false);
                                                                        alert('Landmark berhasil ditambahkan!');
                                                                    }}
                                                                    className="flex-1 h-[40px] bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-1 transition-colors"
                                                                >
                                                                    Simpan Landmark
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setNewLandmarkName('');
                                                                        setGoogleMapsUrlInput('');
                                                                        setShowAddLandmarkForm(false);
                                                                    }}
                                                                    className="h-[40px] px-4 bg-slate-100 hover:bg-slate-200 text-gray-700 font-bold text-xs uppercase tracking-wider rounded-xl border border-gray-200 transition-colors"
                                                                >
                                                                    Batal
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className={`flex flex-col gap-1.5 p-3 rounded-2xl relative transition-all ${
                                                currentEvalData.hasRevision && currentEvalData.publicFacilities
                                                    ? 'border-2 border-amber-400 ring-4 ring-amber-400/30 shadow-[0_0_25px_rgba(245,158,11,0.25)] bg-gradient-to-br from-amber-500/[0.04] via-white to-orange-500/[0.02] animate-pulse'
                                                    : ''
                                            }`}>
                                                {currentEvalData.hasRevision && currentEvalData.publicFacilities && (
                                                    <div className="absolute -top-3 right-4 z-10 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-[10px] uppercase tracking-wider shadow-md shadow-amber-500/30 animate-bounce">
                                                        <Sparkles size={12} />
                                                        <span>⚠️ Perlu Revisi: Fasilitas Umum</span>
                                                    </div>
                                                )}
                                                <label className="text-[11px] font-bold text-[#584235] uppercase tracking-wider">Fasilitas Umum</label>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {['WiFi', 'Area Parkir', 'Dapur Bersama', 'WC Umum', 'Ruang Tamu', 'CCTV', 'Laundry', 'Mushola', 'Area Jemuran', 'Security 24 Jam', 'Akses 24 Jam', 'Lift', 'Cleaning Service'].map(fac => {
                                                          const isChecked = checkHasFacility(kmListingForm.facilities, fac);
                                                          return (
                                                              <React.Fragment key={fac}>
                                                                  <label className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all ${isChecked ? 'border-[#ff7a00] bg-orange-50/50 text-[#584235] font-bold shadow-xs' : 'border-[#e0c0af] bg-[#f8f9ff] text-gray-600'}`}>
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
                                                                                      'wc umum': ['wc umum', 'toilet umum', 'kamar mandi luar', 'wc luar'],
                                                                                      'ruang tamu': ['ruang tamu', 'ruang santai'],
                                                                                      'cctv': ['cctv', 'kamera keamanan'],
                                                                                      'laundry': ['laundry', 'mesin cuci', 'cuci'],
                                                                                      'mushola': ['mushola', 'musholla'],
                                                                                      'area jemuran': ['area jemuran', 'jemuran', 'tempat jemuran'],
                                                                                      'security 24 jam': ['security 24 jam', 'security', 'satpam', 'penjaga kost'],
                                                                                      'akses 24 jam': ['akses 24 jam', 'bebas jam malam', '24 jam'],
                                                                                      'lift': ['lift'],
                                                                                      'cleaning service': ['cleaning service', 'pembersihan', 'kebersihan']
                                                                                  };
                                                                                  const targetSyns = synonyms[normalizedTarget] || [normalizedTarget];
                                                                                  updated = current.filter((f: string) => {
                                                                                      const nf = (f || '').toLowerCase().trim();
                                                                                      return !targetSyns.some(syn => nf === syn || nf.includes(syn) || syn.includes(nf));
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
                                                                                          {kCustoms.map((fac: string) => (
                                                                                              <span key={fac} className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-[#ff7a00] text-[9px] font-black rounded uppercase tracking-wider">
                                                                                                  {fac}
                                                                                                  <button 
                                                                                                      type="button" 
                                                                                                      onClick={() => {
                                                                                                          const current = kmListingForm.publicKitchenFacilities || [];
                                                                                                          setKmListingForm({ ...kmListingForm, publicKitchenFacilities: current.filter((f) => f !== fac) });
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
                                                                                      className="flex-grow h-[28px] px-2 border border-[#e0c0af] rounded text-[11px] bg-white outline-none text-[#584235] font-bold"
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
                                                                                      className="h-[28px] px-3 bg-[#ff7a00] hover:bg-orange-600 text-white font-bold text-[10px] uppercase rounded flex items-center justify-center transition-colors shadow-sm cursor-pointer"
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
                                                                                          {pCustoms.map((fac: string) => (
                                                                                              <span key={fac} className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-[#ff7a00] text-[9px] font-black rounded uppercase tracking-wider">
                                                                                                  {fac}
                                                                                                  <button 
                                                                                                      type="button" 
                                                                                                      onClick={() => {
                                                                                                          const current = kmListingForm.publicParkingFacilities || [];
                                                                                                          setKmListingForm({ ...kmListingForm, publicParkingFacilities: current.filter((f) => f !== fac) });
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
                                                                                      className="flex-grow h-[28px] px-2 border border-[#e0c0af] rounded text-[11px] bg-white outline-none text-[#584235] font-bold"
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
                                                                                      className="h-[28px] px-3 bg-[#ff7a00] hover:bg-orange-600 text-white font-bold text-[10px] uppercase rounded flex items-center justify-center transition-colors shadow-sm cursor-pointer"
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
                                                                                          {bCustoms.map((fac: string) => (
                                                                                              <span key={fac} className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-[#ff7a00] text-[9px] font-black rounded uppercase tracking-wider">
                                                                                                  {fac}
                                                                                                  <button 
                                                                                                      type="button" 
                                                                                                      onClick={() => {
                                                                                                          const current = kmListingForm.publicBathroomFacilities || [];
                                                                                                          setKmListingForm({ ...kmListingForm, publicBathroomFacilities: current.filter((f) => f !== fac) });
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
                                                                                      className="flex-grow h-[28px] px-2 border border-[#e0c0af] rounded text-[11px] bg-white outline-none text-[#584235] font-bold"
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
                                                                                      className="h-[28px] px-3 bg-[#ff7a00] hover:bg-orange-600 text-white font-bold text-[10px] uppercase rounded flex items-center justify-center transition-colors shadow-sm cursor-pointer"
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
                                                {(() => {
                                                    const STANDARD_AND_SUB_KEYS = [
                                                        'wifi', 'wi-fi', 'internet',
                                                        'area parkir', 'parkir', 'parkiran', 'tempat parkir', 'parkir motor', 'parkir mobil', 'parkir sepeda',
                                                        'dapur', 'dapur bersama', 'dapur umum', 'kompor', 'kulkas', 'kulkas bersama', 'kulkas umum', 'dispenser', 'dispenser air', 'wastafel cuci piring', 'wastafel dapur', 'peralatan masak', 'meja makan', 'meja makan bersama',
                                                        'wc umum', 'toilet umum', 'kamar mandi luar', 'wc luar', 'kloset duduk', 'kloset jongkok', 'shower', 'wastafel', 'wastafel wc',
                                                        'ruang tamu', 'ruang santai',
                                                        'cctv', 'kamera keamanan',
                                                        'laundry', 'mesin cuci', 'cuci',
                                                        'mushola', 'musholla',
                                                        'area jemuran', 'jemuran', 'tempat jemuran',
                                                        'security 24 jam', 'security', 'satpam', 'penjaga kost',
                                                        'akses 24 jam', 'bebas jam malam', '24 jam',
                                                        'lift',
                                                        'cleaning service', 'pembersihan', 'kebersihan'
                                                    ];
                                                    const customFacs = (kmListingForm.facilities || []).filter(
                                                        (f: string) => !STANDARD_AND_SUB_KEYS.includes((f || '').toLowerCase().trim())
                                                    );
                                                    if (customFacs.length === 0) return null;
                                                    return (
                                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                                            {customFacs.map((fac: string) => (
                                                                <span key={fac} className="inline-flex items-center gap-1.5 bg-[#eff4ff] text-[#264191] text-[10px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-lg border border-[#d3e4fe]">
                                                                    <span>{fac}</span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setKmListingForm({
                                                                                ...kmListingForm,
                                                                                facilities: (kmListingForm.facilities || []).filter((f: string) => f !== fac)
                                                                            });
                                                                        }}
                                                                        className="text-red-500 hover:text-red-700 font-bold ml-1 text-[11px] leading-none cursor-pointer"
                                                                    >
                                                                        &times;
                                                                    </button>
                                                                </span>
                                                            ))}
                                                        </div>
                                                    );
                                                })()}

                                                <div className="flex gap-2 mt-2">
                                                    <input 
                                                        type="text"
                                                        placeholder="Tambah fasilitas kustom..."
                                                        value={newFacilityName}
                                                        onChange={e => setNewFacilityName(e.target.value)}
                                                        className="flex-1 h-[36px] px-3 border border-gray-300 rounded-lg text-xs"
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
                                                        className="bg-[#ff7a00] text-white px-3 rounded-lg text-xs font-bold"
                                                    >
                                                        + Tambah
                                                    </button>
                                                </div>
                                            </div>

                                            <div className={`flex flex-col gap-2 p-3 rounded-2xl relative transition-all ${
                                                currentEvalData.hasRevision && (currentEvalData.facade || currentEvalData.publicFacilities)
                                                    ? 'border-2 border-amber-400 ring-4 ring-amber-400/30 shadow-[0_0_25px_rgba(245,158,11,0.25)] bg-gradient-to-br from-amber-500/[0.04] via-white to-orange-500/[0.02] animate-pulse'
                                                    : ''
                                            }`}>
                                                {currentEvalData.hasRevision && (currentEvalData.facade || currentEvalData.publicFacilities) && (
                                                    <div className="absolute -top-3 right-4 z-10 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-[10px] uppercase tracking-wider shadow-md shadow-amber-500/30 animate-bounce">
                                                        <Sparkles size={12} />
                                                        <span>⚠️ Perlu Revisi: Foto Area Properti</span>
                                                    </div>
                                                )}
                                                <div className="flex items-center justify-between">
                                                    <label className="text-[11px] font-bold text-[#584235] uppercase tracking-wider">Dokumentasi Area Umum &amp; Fasilitas Properti</label>
                                                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                                                        <ShieldAlert className="w-3 h-3 text-amber-600" />
                                                        <span>Auto-Sensor Banner Aktif</span>
                                                    </span>
                                                </div>

                                                {kmBannerNotice && (
                                                    <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-300 text-amber-900 text-xs font-medium flex items-center gap-2 animate-fadeIn">
                                                        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 animate-bounce" />
                                                        <span>{kmBannerNotice}</span>
                                                    </div>
                                                )}

                                                {(() => {
                                                    const imagesWithCats = (kmListingForm.image_urls || []).map((urlOrObj: any, idx: number) => {
                                                        const url = getImageUrlString(urlOrObj);
                                                        let rawCat = (typeof urlOrObj === 'object' && urlOrObj.label)
                                                            ? urlOrObj.label
                                                            : (kmListingForm.photoCategories?.[idx] || photoCategories[idx] || 'Foto Properti');
                                                        if (rawCat.toLowerCase() === 'area umum' || rawCat.toLowerCase() === 'parkiran') rawCat = 'Area Parkir';
                                                        return { url, idx, rawCat };
                                                    }).filter(item => !!item.url);

                                                    return (
                                                        <div className="space-y-3">
                                                            {photoCategories.map((label: string) => {
                                                                const catPhotos = imagesWithCats.filter(item => item.rawCat === label);

                                                                return (
                                                                    <div key={label} className="bg-white border border-[#e0c0af]/60 rounded-xl p-3 shadow-xs space-y-2.5">
                                                                        <div className="flex justify-between items-center">
                                                                            <div className="flex items-center gap-1.5">
                                                                                {label.toLowerCase().includes('depan') || label.toLowerCase().includes('gedung') || label.toLowerCase().includes('fasad') ? <Home className="w-3.5 h-3.5 text-[#ff7a00] shrink-0" /> :
                                                                                 label.toLowerCase().includes('parkir') || label.toLowerCase().includes('motor') || label.toLowerCase().includes('mobil') || label.toLowerCase().includes('sepeda') || label.toLowerCase().includes('garasi') ? <MapPin className="w-3.5 h-3.5 text-[#ff7a00] shrink-0" /> :
                                                                                 label.toLowerCase().includes('dapur') || label.toLowerCase().includes('kompor') || label.toLowerCase().includes('kulkas') || label.toLowerCase().includes('dispenser') || label.toLowerCase().includes('masak') || label.toLowerCase().includes('makan') ? <CookingPot className="w-3.5 h-3.5 text-[#ff7a00] shrink-0" /> :
                                                                                 label.toLowerCase().includes('wc') || label.toLowerCase().includes('toilet') || label.toLowerCase().includes('kloset') || label.toLowerCase().includes('shower') || label.toLowerCase().includes('wastafel') || label.toLowerCase().includes('kamar mandi') ? <Bath className="w-3.5 h-3.5 text-[#ff7a00] shrink-0" /> :
                                                                                 label.toLowerCase().includes('ruang tamu') || label.toLowerCase().includes('santai') || label.toLowerCase().includes('sofa') ? <Armchair className="w-3.5 h-3.5 text-[#ff7a00] shrink-0" /> :
                                                                                 label.toLowerCase().includes('cctv') ? <Eye className="w-3.5 h-3.5 text-[#ff7a00] shrink-0" /> :
                                                                                 label.toLowerCase().includes('laundry') || label.toLowerCase().includes('jemuran') || label.toLowerCase().includes('cuci') ? <Sparkles className="w-3.5 h-3.5 text-[#ff7a00] shrink-0" /> :
                                                                                 <Camera className="w-3.5 h-3.5 text-[#ff7a00] shrink-0" />}
                                                                                <span className="text-[11px] font-bold text-[#584235] uppercase tracking-wider">{label}</span>
                                                                                {isBannerProneCategory(label) && (
                                                                                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                                                                                        Banner Protected
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${catPhotos.length > 0 ? 'bg-orange-100 text-[#ff7a00]' : 'bg-gray-100 text-gray-500'}`}>
                                                                                {catPhotos.length} Foto
                                                                            </span>
                                                                        </div>

                                                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                                            {catPhotos.map((p, pIdx) => {
                                                                                const isThisScanning = reScanningPhotoUrl === p.url;
                                                                                return (
                                                                                    <div key={p.idx} className="aspect-video w-full rounded-lg overflow-hidden border border-gray-200 relative group bg-gray-50">
                                                                                        <img src={getImageUrlString(p.url)} alt={`${label} ${pIdx + 1}`} className="w-full h-full object-cover" />
                                                                                        {isThisScanning && (
                                                                                            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white z-10">
                                                                                                <Loader2 className="w-5 h-5 animate-spin text-orange-400 mb-1" />
                                                                                                <span className="text-[9px] font-bold">Scanning...</span>
                                                                                            </div>
                                                                                        )}
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => {
                                                                                                const updatedImages = [...(kmListingForm.image_urls || [])];
                                                                                                const updatedCats = [...(kmListingForm.photoCategories || [])];
                                                                                                updatedImages.splice(p.idx, 1);
                                                                                                updatedCats.splice(p.idx, 1);
                                                                                                const updatedForm = { 
                                                                                                    ...kmListingForm, 
                                                                                                    image_urls: updatedImages,
                                                                                                    photoCategories: updatedCats
                                                                                                };
                                                                                                setKmListingForm(updatedForm);
                                                                                                saveKostManagerDraftToDatabase(updatedForm, kmStep, photoCategories);
                                                                                            }}
                                                                                            className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow-md transition-all active:scale-90 z-10"
                                                                                            title="Hapus foto ini"
                                                                                        >
                                                                                            &times;
                                                                                        </button>
                                                                                        {isBannerProneCategory(label) && (
                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={() => handleOpenSensorModal(p.idx, p.url, label)}
                                                                                                className="absolute top-1 left-1 bg-amber-500/90 hover:bg-amber-600 text-white rounded px-1.5 py-0.5 text-[8px] font-bold shadow-sm transition-all flex items-center gap-1 z-10"
                                                                                                title="Sensor ulang / gambar kotak sensor manual di foto ini"
                                                                                            >
                                                                                                <ShieldAlert className="w-2.5 h-2.5" />
                                                                                                <span>Sensor Ulang</span>
                                                                                            </button>
                                                                                        )}
                                                                                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 py-0.5 px-1 text-[8px] text-white text-center uppercase font-bold tracking-wider truncate">
                                                                                            {label} {pIdx + 1}
                                                                                        </div>
                                                                                    </div>
                                                                                );
                                                                            })}

                                                                            <div 
                                                                                onClick={async () => {
                                                                                    const input = document.createElement('input');
                                                                                    input.type = 'file';
                                                                                    input.accept = 'image/*';
                                                                                    input.multiple = true;
                                                                                    input.onchange = async (e: any) => {
                                                                                        const files = e.target?.files;
                                                                                        if (files && files.length > 0) {
                                                                                            const uploadKey = `public_${label}`;
                                                                                            setUploadingPublicAreas(prev => ({ ...prev, [uploadKey]: true }));
                                                                                            try {
                                                                                                const newUrls = [];
                                                                                                for (let f = 0; f < files.length; f++) {
                                                                                                    const folder = `kostmanager/public/${Date.now()}_${f}`;
                                                                                                    const processedFile = await processPhotoWithAutoSensor(files[f], label, (detectedInfo) => {
                                                                                                        if (detectedInfo && detectedInfo.detectedCount > 0) {
                                                                                                            setKmBannerNotice(`🛡️ Auto-Sensor AI mendeteksi & menyensor ${detectedInfo.detectedCount} area kontak pada foto "${label}".`);
                                                                                                            setTimeout(() => setKmBannerNotice(null), 8000);
                                                                                                        }
                                                                                                    });
                                                                                                    const publicUrl = await uploadFileAndGetURL(processedFile, folder);
                                                                                                    newUrls.push(publicUrl);
                                                                                                }
                                                                                                const updatedImages = [...(kmListingForm.image_urls || [])];
                                                                                                const updatedCats = [...(kmListingForm.photoCategories || [])];
                                                                                                newUrls.forEach(u => {
                                                                                                    updatedImages.push(u);
                                                                                                    updatedCats.push(label);
                                                                                                });
                                                                                                const updatedForm = { 
                                                                                                    ...kmListingForm, 
                                                                                                    image_urls: updatedImages,
                                                                                                    photoCategories: updatedCats
                                                                                                };
                                                                                                setKmListingForm(updatedForm);
                                                                                                saveKostManagerDraftToDatabase(updatedForm, kmStep, photoCategories);
                                                                                            } catch (err) {
                                                                                                alert('Gagal unggah foto: ' + (err as Error).message);
                                                                                            } finally {
                                                                                                setUploadingPublicAreas(prev => ({ ...prev, [uploadKey]: false }));
                                                                                            }
                                                                                        }
                                                                                    };
                                                                                    input.click();
                                                                                }}
                                                                                className={`aspect-video bg-white border-2 border-dashed border-[#ff7a00] rounded-lg flex flex-col items-center justify-center p-2 cursor-pointer hover:bg-orange-50/50 transition-all text-[#584235] ${catPhotos.length === 0 ? 'col-span-2 sm:col-span-3 py-4' : ''}`}
                                                                            >
                                                                                {uploadingPublicAreas[`public_${label}`] ? (
                                                                                    <span className="text-[10px] font-bold animate-pulse text-gray-500">Processing &amp; Uploading...</span>
                                                                                ) : (
                                                                                    <>
                                                                                        <ImagePlus className="w-5 h-5 text-[#ff7a00] shrink-0" />
                                                                                        <span className="text-[9px] font-bold uppercase tracking-wider mt-0.5 text-center">
                                                                                            {catPhotos.length === 0 ? `+ Unggah Foto ${label}` : '+ Tambah Foto'}
                                                                                        </span>
                                                                                    </>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    );
                                                })()}

                                                <div className="flex gap-2 mt-2">
                                                    <input 
                                                        type="text" 
                                                        placeholder="Kategori Foto Baru (misal: Dapur Bersama)" 
                                                        value={newPhotoCategoryName} 
                                                        onChange={e => setNewPhotoCategoryName(e.target.value)} 
                                                        className="flex-1 h-[36px] px-3 border border-gray-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-orange-500" 
                                                    />
                                                    <button 
                                                        type="button" 
                                                        onClick={() => {
                                                            if (!newPhotoCategoryName.trim()) return;
                                                            const cat = newPhotoCategoryName.trim();
                                                            setPhotoCategories(prev => [...prev, cat]);
                                                            setNewPhotoCategoryName('');
                                                        }} 
                                                        className="bg-[#eff4ff] hover:bg-[#dce9ff] text-[#ff7a00] font-bold text-xs uppercase px-4 rounded-lg border border-[#e0c0af] transition-colors"
                                                    >
                                                        + Kategori Area
                                                    </button>
                                                </div>
                                            </div>

                                            <div className={`rounded-xl p-4 flex flex-col gap-3 relative transition-all ${
                                                currentEvalData.hasRevision && currentEvalData.rules
                                                    ? 'border-2 border-amber-400 ring-4 ring-amber-400/30 shadow-[0_0_25px_rgba(245,158,11,0.25)] bg-gradient-to-br from-amber-500/[0.04] via-[#f8f9ff] to-orange-500/[0.02] animate-pulse'
                                                    : 'border border-[#e0c0af] bg-[#f8f9ff]'
                                            }`}>
                                                {currentEvalData.hasRevision && currentEvalData.rules && (
                                                    <div className="absolute -top-3 right-4 z-10 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-[10px] uppercase tracking-wider shadow-md shadow-amber-500/30 animate-bounce">
                                                        <Sparkles size={12} />
                                                        <span>⚠️ Perlu Revisi: Peraturan Kost</span>
                                                    </div>
                                                )}
                                                <div className="flex items-center justify-between">
                                                    <h4 className="font-bold text-xs text-[#0b1c30]">Peraturan Kost</h4>
                                                    <span className="text-[9px] font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                        {(kmListingForm.rules || []).length} Aturan Aktif
                                                    </span>
                                                </div>

                                                {/* Quick Preset Chips */}
                                                <div className="space-y-1 pt-1">
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

                                                <div className="flex flex-col gap-2 pt-1">                                                     {kmListingForm.rules && kmListingForm.rules.map((rule: string, rIdx: number) => (
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
                                                                 className="flex-1 min-h-[50px] p-2 border border-[#8c7263] rounded-lg text-[11px] bg-white resize-none leading-normal outline-none focus:ring-1 focus:ring-[#ff7a00]"
                                                             />
                                                            <button 
                                                                type="button"
                                                                onClick={() => {
                                                                    setKmListingForm({
                                                                        ...kmListingForm,
                                                                        rules: kmListingForm.rules.filter((_: any, idx: number) => idx !== rIdx)
                                                                    });
                                                                }}
                                                                className="text-red-500 hover:bg-red-50 p-2 rounded-lg"
                                                            >
                                                                <Trash2 className="w-4 h-4 shrink-0" />
                                                            </button>
                                                        </div>
                                                    ))}                                                    <div className="flex gap-2 mt-1">
                                                         <input 
                                                             type="text"
                                                             placeholder="Tambah peraturan baru..."
                                                             value={newRuleName}
                                                             maxLength={100}
                                                             onChange={e => setNewRuleName(e.target.value.slice(0, 100))}
                                                             className="flex-1 h-[36px] px-3 border border-gray-300 rounded-lg text-xs bg-white outline-none"
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
                                                            className="bg-[#ff7a00] text-white px-3 rounded-lg text-xs font-bold"
                                                        >
                                                            + Tambah
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </section>
                                    </div>
                                )})()}

                                {/* STEP 2: DATA KAMAR */}
                                {kmStep === 2 && (() => {
                                    const currentEvalData = parseEvaluationData(isEditingKostManager?.notes, isEditingKostManager?.status);

                                    return (
                                        <div className="space-y-6">
                                            {/* Room Revision Top Banner if room evaluated */}
                                            {currentEvalData.hasRevision && currentEvalData.hasRoom && (
                                                <div className="relative overflow-hidden rounded-2xl border-2 border-amber-400 bg-gradient-to-br from-amber-500/[0.08] via-orange-500/[0.03] to-amber-500/[0.08] p-3.5 shadow-[0_0_20px_rgba(245,158,11,0.15)] flex items-center justify-between gap-3 animate-fadeIn">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-xs shrink-0 animate-bounce">
                                                            <AlertTriangle size={16} />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-black text-amber-950 uppercase tracking-wider">
                                                                Bagian Kamar Perlu Direvisi
                                                            </p>
                                                            <p className="text-[10px] font-bold text-amber-700">
                                                                Periksa ukuran, tarif, fasilitas, status terisi/kosong, atau foto unit di bawah ini.
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <span className="px-2 py-0.5 rounded-full bg-amber-200/90 text-amber-900 border border-amber-300 text-[9px] font-black uppercase tracking-wider animate-pulse">
                                                        ✨ Evaluasi Unit
                                                    </span>
                                                </div>
                                            )}

                                            {/* Room List Section */}
                                            <div className="space-y-4">
                                                <h2 className="text-xs font-bold text-[#0b1c30] px-1 uppercase tracking-wider">Daftar Kamar</h2>
                                                <div className="flex justify-between items-center bg-[#fff4eb] border border-[#ffe2cc] p-3 rounded-xl">
                                                    <span className="text-[11px] font-bold text-[#584235] uppercase tracking-wider">Progres Pendataan Kamar</span>
                                                    <span className={`text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${(kmListingForm.roomTypes?.length || 0) === (kmListingForm.totalRooms || 0) ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                                        {kmListingForm.roomTypes?.length || 0} / {kmListingForm.totalRooms || 0} Kamar
                                                    </span>
                                                </div>
                                             <div className="grid grid-cols-1 gap-3">
                                                 {(!kmListingForm.roomTypes || kmListingForm.roomTypes.length === 0) ? (
                                                     <div className="text-center py-6 text-gray-500 text-xs bg-white rounded-xl border border-dashed border-gray-300">
                                                         Belum ada kamar yang ditambahkan. Silakan klik tombol di bawah untuk menambah kamar.
                                                     </div>
                                                 ) : (
                                                     kmListingForm.roomTypes.map((rt: any, idx: number) => {
                                                         const isOccupied = rt.isAvailable === false || rt.status === 'Terisi';
                                                         const isActive = activeRoomIdx === idx && temporaryRoom === null;
                                                              return (
                                                                  <div 
                                                                      key={idx} 
                                                                      className={`bg-white hover:shadow-md rounded-xl border transition-all cursor-pointer overflow-hidden ${isActive ? 'border-[#ff7a00] ring-1 ring-[#ff7a00] shadow-sm' : 'border-gray-200'}`}
                                                                  >
                                                                      {/* Card Header (Clickable for Expand/Collapse) */}
                                                                      <div 
                                                                          onClick={() => {
                                                                              setTemporaryRoom(null);
                                                                              if (isActive) {
                                                                                  setActiveRoomIdx(null);
                                                                              } else {
                                                                                  setActiveRoomIdx(idx);
                                                                              }
                                                                          }}
                                                                          className="p-4 flex justify-between items-center"
                                                                      >
                                                                          <div className="flex items-center gap-3">
                                                                              <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center text-[#ff7a00]">
                                                                                  <Bed className="w-4 h-4 text-[#ff7a00] shrink-0" />
                                                                              </div>
                                                                              <div>
                                                                                  <p className="text-xs font-bold text-gray-900">{rt.name || `Kamar ${idx + 1}`}</p>
                                                                                  <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wider">
                                                                                      {rt.floor || 'Lantai 1'} • {rt.type || 'Standard'}
                                                                                  </p>
                                                                              </div>
                                                                          </div>
                                                                          <div className="flex items-center gap-2">
                                                                              {isOccupied ? (
                                                                                  <span className="px-3 py-1 rounded-full bg-green-50 text-green-700 text-[10px] font-black uppercase tracking-wider border border-green-200">Terisi</span>
                                                                              ) : (
                                                                                  <span className="px-3 py-1 rounded-full bg-orange-50 text-orange-700 text-[10px] font-black uppercase tracking-wider border border-orange-200">Kosong</span>
                                                                              )}
                                                                              <button
                                                                                  type="button"
                                                                                  onClick={(e) => {
                                                                                      e.stopPropagation();
                                                                                      setDeleteRoomConfirm({ open: true, idx });
                                                                                  }}
                                                                                  className="text-red-500 hover:text-red-700 p-1.5 rounded-lg mr-1"
                                                                              >
                                                                                  <Trash2 className="w-4 h-4 shrink-0" />
                                                                              </button>
                                                                              <ChevronDown 
                                                                                  className="w-4 h-4 text-gray-400 transition-transform duration-300 shrink-0"
                                                                                  style={{ transform: isActive ? 'rotate(180deg)' : 'rotate(0deg)' }}
                                                                              />
                                                                          </div>
                                                                      </div>

                                                                      {/* Accordion Body */}
                                                                      <div 
                                                                          style={{
                                                                              display: 'grid',
                                                                              gridTemplateRows: isActive ? '1fr' : '0fr',
                                                                              transition: 'grid-template-rows 300ms cubic-bezier(0.4, 0, 0.2, 1), opacity 300ms ease-in-out',
                                                                              opacity: isActive ? 1 : 0
                                                                          }}
                                                                      >
                                                                          <div style={{ minHeight: 0, overflow: 'hidden' }}>
                                                                              {renderRoomEditor(rt, idx)}
                                                                          </div>
                                                                      </div>
                                                                  </div>
                                                              );
                                                     })
                                                 )}
                                             </div>

                                             {/* Modal Konfirmasi Hapus Kamar */}
                                             {deleteRoomConfirm.open && (
                                                 <div
                                                     className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
                                                     style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
                                                     onClick={() => setDeleteRoomConfirm({ open: false, idx: null })}
                                                 >
                                                     <div
                                                         className="bg-white rounded-2xl shadow-2xl w-full max-w-xs p-6 flex flex-col items-center gap-4"
                                                         onClick={(e) => e.stopPropagation()}
                                                     >
                                                         <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center border-2 border-red-100">
                                                             <Trash2 className="w-6 h-6 text-red-500" />
                                                         </div>
                                                         <div className="text-center">
                                                             <h3 className="text-sm font-black text-gray-900 mb-1">Hapus Kamar Ini?</h3>
                                                             <p className="text-xs text-gray-500 leading-relaxed">
                                                                 Kamar{' '}
                                                                 <span className="font-bold text-gray-700">
                                                                     {deleteRoomConfirm.idx !== null && kmListingForm.roomTypes?.[deleteRoomConfirm.idx]?.name
                                                                         ? `"${kmListingForm.roomTypes[deleteRoomConfirm.idx].name}"`
                                                                         : `#${(deleteRoomConfirm.idx ?? 0) + 1}`}
                                                                 </span>{' '}
                                                                 akan dihapus dari daftar. Tindakan ini tidak dapat dibatalkan.
                                                             </p>
                                                         </div>
                                                         <div className="flex gap-3 w-full mt-1">
                                                             <button
                                                                 type="button"
                                                                 onClick={() => setDeleteRoomConfirm({ open: false, idx: null })}
                                                                 className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-xs font-bold hover:bg-gray-50 transition-colors"
                                                             >
                                                                 Batal
                                                             </button>
                                                             <button
                                                                 type="button"
                                                                 onClick={() => {
                                                                     const idxToDelete = deleteRoomConfirm.idx;
                                                                     if (idxToDelete === null) return;
                                                                     const updated = kmListingForm.roomTypes.filter((_: any, rIdx: number) => rIdx !== idxToDelete);
                                                                     setKmListingForm({ ...kmListingForm, roomTypes: updated });
                                                                     if (activeRoomIdx === idxToDelete) {
                                                                         setActiveRoomIdx(null);
                                                                     } else if (activeRoomIdx !== null && activeRoomIdx > idxToDelete) {
                                                                         setActiveRoomIdx(activeRoomIdx - 1);
                                                                     }
                                                                     setDeleteRoomConfirm({ open: false, idx: null });
                                                                 }}
                                                                 className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition-colors"
                                                             >
                                                                 Ya, Hapus
                                                             </button>
                                                         </div>
                                                     </div>
                                                 </div>
                                             )}
                                             
                                             {/* Add New Room Button */}
                                             {(kmListingForm.roomTypes?.length || 0) < (kmListingForm.totalRooms || 0) ? (
                                             <button 
                                                 type="button"
                                                 onClick={() => {
                                                     setActiveRoomIdx(null); // Deselect existing room
                                                     setTemporaryRoom({
                                                         name: '',
                                                         floor: '',
                                                         type: '',
                                                         status: '',
                                                         isAvailable: null,
                                                         price: '',
                                                         pricing: [{ period: 'bulanan', price: '' }],
                                                         roomFacilities: [],
                                                        photoCategories: ['Interior Kamar *Wajib'],
                                                        images: [''],
                                                         readyDate: '',
                                                         residentName: '',
                                                         residentPhone: '',
                                                         startDate: '',
                                                         endDate: '',
                                                         paymentPeriod: 'bulanan',
                                                         currentOccupants: 1,
                                                         additionalOccupants: [],
                                                         isPaid: true,
                                                         remainingBill: '',
                                                         residentKtpUrl: '',
                                                         paymentProofUrl: ''
                                                     });
                                                 }}
                                                 className="w-full py-4 bg-white border-2 border-dashed border-[#ff7a00] hover:bg-orange-50/50 rounded-xl flex items-center justify-center gap-2 text-[#ff7a00] font-bold text-xs uppercase tracking-wider transition-all active:scale-98"
                                             >
                                                 <Plus className="w-4 h-4 shrink-0" />
                                                 Tambah Kamar Baru
                                             </button>
                                             ) : (
                                                 <div className="text-center py-4 text-[#584235] text-xs font-bold bg-[#fff4eb] rounded-xl border border-dashed border-[#ffe2cc] leading-normal p-3">
                                                     Target jumlah kamar ({kmListingForm.totalRooms}) telah tercapai.
                                                     <br />
                                                     <span className="text-[10px] text-gray-500 font-normal italic">
                                                         * Hapus kamar aktif atau kembali ke Step 1 untuk menaikkan kapasitas kamar properti.
                                                     </span>
                                                 </div>
                                             )}
                                         </div>

                                         {/* Active Entry: Unsaved Temporary Room Form Editor */}
                                         {temporaryRoom !== null && (() => {
                                                const updateTemporaryRoomFacilitiesWithPhotos = (newFacilities: string[], newStatus?: string) => {
                                                     const statusToUse = newStatus !== undefined ? newStatus : (temporaryRoom.status || 'Kosong');
                                                     const currentCategorized = getRoomCategorizedPhotos(temporaryRoom);

                                                     // Re-key Interior category if status changed between Terisi and Kosong
                                                     const updatedCategorized: Record<string, string[]> = {};
                                                     Object.entries(currentCategorized).forEach(([catKey, urls]) => {
                                                         if (catKey.includes('Interior')) {
                                                             const newKey = statusToUse === 'Terisi' ? 'Interior Kamar (Opsional)' : 'Interior Kamar *Wajib';
                                                             updatedCategorized[newKey] = urls;
                                                         } else {
                                                             updatedCategorized[catKey] = urls;
                                                         }
                                                     });

                                                     const { images, photoCategories } = exportCategorizedPhotos(updatedCategorized);

                                                     setTemporaryRoom({
                                                         ...temporaryRoom,
                                                         ...(newStatus !== undefined ? { status: newStatus, isAvailable: newStatus !== 'Terisi' } : {}),
                                                         roomFacilities: newFacilities,
                                                         categorized_photos: updatedCategorized,
                                                         categorizedPhotos: updatedCategorized,
                                                         photoCategories,
                                                         images
                                                     });
                                                 };

                                                return (
                                              <div className="bg-white rounded-xl border-2 border-[#ff7a00] overflow-hidden shadow-md transition-all">
                                                  <div className="bg-[#fff4eb] p-4 flex justify-between items-center border-b border-[#ffe2cc]">
                                                      <h2 className="text-xs font-black uppercase text-[#ff7a00] tracking-wider">Detail Kamar Baru (Belum Disimpan)</h2>
                                                      <button 
                                                          type="button"
                                                          onClick={() => setTemporaryRoom(null)}
                                                          className="text-[#ff7a00] hover:bg-[#ffe2cc] rounded-full p-1 transition-all active:scale-90 flex items-center justify-center"
                                                      >
                                                          <X className="w-4 h-4 shrink-0 font-bold" />
                                                      </button>
                                                  </div>
                                                  <div className="p-4 space-y-5">
                                                      {/* Detail Kamar Section */}
                                                      <div className="border border-gray-150 rounded-xl p-4 flex flex-col gap-3.5 bg-gray-50/30">
                                                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b border-gray-100 pb-1">Detail Kamar</span>
                                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                              <div className="flex flex-col gap-1.5">
                                                                  <label className="text-[11px] font-bold text-[#584235] uppercase tracking-wider">Nomor Kamar</label>
                                                                  <input 
                                                                      type="text"
                                                                      value={temporaryRoom.name || ''}
                                                                      onChange={e => setTemporaryRoom({ ...temporaryRoom, name: e.target.value })}
                                                                      className="w-full h-[40px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white font-bold outline-none text-[#584235]"
                                                                      placeholder="Nomor Kamar"
                                                                  />
                                                              </div>
                                                              <div className="flex flex-col gap-1.5">
                                                                  <label className="text-[11px] font-bold text-[#584235] uppercase tracking-wider">Lantai</label>
                                                                  <select 
                                                                      value={temporaryRoom.floor || ''}
                                                                      onChange={e => setTemporaryRoom({ ...temporaryRoom, floor: e.target.value })}
                                                                      className="w-full h-[40px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white font-bold outline-none text-[#584235]"
                                                                  >
                                                                       <option value="" disabled hidden>Pilih Lantai</option>
                                                                      <option value="Lantai 1">Lantai 1</option>
                                                                      <option value="Lantai 2">Lantai 2</option>
                                                                      <option value="Lantai 3">Lantai 3</option>
                                                                      <option value="Lantai 4">Lantai 4</option>
                                                                  </select>
                                                              </div>
                                                              <div className="md:col-span-2 flex flex-col gap-1.5">
                                                                  <label className="text-[11px] font-bold text-[#584235] uppercase tracking-wider">Tipe Kamar</label>
                                                                  <select 
                                                                      value={['Standard', 'Premium', 'Deluxe', ''].includes(temporaryRoom.type || '') ? (temporaryRoom.type || '') : '__custom__'}
                                                                      onChange={e => {
                                                                          const val = e.target.value;
                                                                          if (val === '__custom__') {
                                                                              setTemporaryRoom({ ...temporaryRoom, type: 'Kustom' });
                                                                          } else {
                                                                              setTemporaryRoom({ ...temporaryRoom, type: val });
                                                                          }
                                                                      }}
                                                                      className="w-full h-[40px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white font-bold outline-none text-[#584235]"
                                                                  >
                                                                      <option value="" disabled hidden>Pilih Tipe Kamar</option>
                                                                      <option value="Standard">Standard</option>
                                                                      <option value="Premium">Premium</option>
                                                                      <option value="Deluxe">Deluxe</option>
                                                                      <option value="__custom__">Tipe Kustom...</option>
                                                                  </select>
                                                                  {!['Standard', 'Premium', 'Deluxe', ''].includes(temporaryRoom.type || '') && (
                                                                      <div className="mt-1.5">
                                                                          <input 
                                                                              type="text"
                                                                              value={temporaryRoom.type === 'Kustom' ? '' : temporaryRoom.type}
                                                                              onChange={e => setTemporaryRoom({ ...temporaryRoom, type: e.target.value })}
                                                                              placeholder="Masukkan tipe kamar kustom..."
                                                                              className="w-full h-[40px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white font-bold outline-none text-[#584235]"
                                                                          />
                                                                      </div>
                                                                  )}
                                                              </div>
                                                              
                                                              {/* Status Kamar (Last Input) */}
                                                              {/* Luas / Ukuran Kamar ([Panjang] X [Lebar] meter) */}
                                                              <div className="md:col-span-2 flex flex-col gap-1.5">
                                                                  <label className="text-[11px] font-bold text-[#584235] uppercase tracking-wider">Luas / Ukuran Kamar</label>
                                                                  <div className="flex items-center gap-2">
                                                                      {(() => {
                                                                          const { length: len, width: wid } = parseDimensionParts(temporaryRoom.size || temporaryRoom.dimensions || '');
                                                                          return (
                                                                              <>
                                                                                  <input 
                                                                                      type="text"
                                                                                      value={len}
                                                                                      onChange={e => {
                                                                                          const newLen = e.target.value;
                                                                                          const formatted = newLen || wid ? `${newLen}x${wid} meter` : '';
                                                                                          setTemporaryRoom({ ...temporaryRoom, size: formatted, dimensions: formatted });
                                                                                      }}
                                                                                      className="w-24 h-[40px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white font-bold outline-none text-[#584235] text-center"
                                                                                      placeholder=""
                                                                                  />
                                                                                  <span className="text-xs font-black text-[#584235] uppercase">X</span>
                                                                                  <input 
                                                                                      type="text"
                                                                                      value={wid}
                                                                                      onChange={e => {
                                                                                          const newWid = e.target.value;
                                                                                          const formatted = len || newWid ? `${len}x${newWid} meter` : '';
                                                                                          setTemporaryRoom({ ...temporaryRoom, size: formatted, dimensions: formatted });
                                                                                      }}
                                                                                      className="w-24 h-[40px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white font-bold outline-none text-[#584235] text-center"
                                                                                      placeholder=""
                                                                                  />
                                                                                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">meter</span>
                                                                              </>
                                                                          );
                                                                      })()}
                                                                  </div>
                                                              </div>

                                                              <div className="md:col-span-2 flex flex-col gap-1.5 mt-2 border-t border-gray-100 pt-3">
                                                                  <label className="text-[11px] font-bold text-[#584235] uppercase tracking-wider">Status Kamar</label>
                                                                  <div className="flex gap-2">
                                                                      <button 
                                                                          type="button"
                                                                          onClick={() => updateTemporaryRoomFacilitiesWithPhotos(temporaryRoom.roomFacilities || [], 'Terisi')}
                                                                          className={`flex-1 py-3 px-4 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all active:scale-95 text-center ${(temporaryRoom.status === 'Terisi') ? 'bg-green-500 text-white border-green-500 shadow-sm' : 'border-gray-300 text-gray-600 bg-white hover:bg-gray-50'}`}
                                                                      >
                                                                          Terisi
                                                                      </button>
                                                                      <button 
                                                                          type="button"
                                                                          onClick={() => updateTemporaryRoomFacilitiesWithPhotos(temporaryRoom.roomFacilities || [], 'Kosong')}
                                                                          className={`flex-1 py-3 px-4 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all active:scale-95 text-center ${(temporaryRoom.status === 'Kosong') ? 'bg-[#ff7a00] text-white border-[#ff7a00] shadow-sm' : 'border-gray-300 text-gray-600 bg-white hover:bg-gray-50'}`}
                                                                      >
                                                                          Kosong
                                                                      </button>
                                                                  </div>
                                                              </div>
                                                          </div>
                                                      </div>

                                                      {/* Conditional form display based on detail fields completed */}
                                                      {!!(temporaryRoom.name?.trim() && temporaryRoom.floor && temporaryRoom.type && temporaryRoom.type !== 'Kustom' && temporaryRoom.status) && (
                                                          <>
                                                      {/* Copy configuration dropdown if other rooms exist */}
                                                      {kmListingForm.roomTypes && kmListingForm.roomTypes.length > 0 && (
                                                          <div className="border border-[#d3e4fe] bg-[#eff4ff]/30 rounded-xl p-4 flex flex-col gap-2">
                                                              <label className="text-[11px] font-black text-[#264191] uppercase tracking-wider">Salin Tarif & Fasilitas Dari Kamar Lain</label>
                                                              <select 
                                                                  value=""
                                                                  onChange={e => {
                                                                      const selectedIdx = parseInt(e.target.value);
                                                                      const sourceRoom = kmListingForm.roomTypes[selectedIdx];
                                                                      if (sourceRoom) {
                                                                          const newFacs = sourceRoom.roomFacilities ? [...sourceRoom.roomFacilities] : [];
                                                                          const dynamicCats = computeDynamicRoomPhotoCategories(newFacs, temporaryRoom.status || 'Kosong', []);
                                                                          setTemporaryRoom({
                                                                              ...temporaryRoom,
                                                                              price: sourceRoom.price || '',
                                                                              pricing: sourceRoom.pricing ? JSON.parse(JSON.stringify(sourceRoom.pricing)) : [{ period: 'bulanan', price: '' }],
                                                                              roomFacilities: newFacs,
                                                                              bathroomFacilities: sourceRoom.bathroomFacilities ? [...sourceRoom.bathroomFacilities] : [],
                                                                              kitchenFacilities: sourceRoom.kitchenFacilities ? [...sourceRoom.kitchenFacilities] : [],
                                                                              maxOccupants: sourceRoom.maxOccupants ?? '',
                                                                              extraOccupantFee: sourceRoom.extraOccupantFee ?? '',
                                                                              photoCategories: dynamicCats,
                                                                              images: dynamicCats.map(() => '')
                                                                          });
                                                                          alert(`Tarif & Fasilitas berhasil disalin dari Kamar ${sourceRoom.name}!`);
                                                                      }
                                                                  }}
                                                                  className="w-full h-[40px] px-3 border border-[#b4cdfe] rounded-lg text-xs bg-white font-bold outline-none text-[#264191]"
                                                              >
                                                                  <option value="" disabled>-- Pilih Kamar Sumber --</option>
                                                                  {kmListingForm.roomTypes.map((r: any, rIdx: number) => (
                                                                      <option key={rIdx} value={rIdx}>
                                                                          Kamar {r.name} ({r.type || 'Standard'} - {r.floor || 'Lantai 1'})
                                                                      </option>
                                                                  ))}
                                                              </select>
                                                          </div>
                                                      )}
                                                      {/* Skema Tarif / Harga Kamar Section */}
                                                      <div className="border border-gray-150 rounded-xl p-4 flex flex-col gap-3.5 bg-gray-50/30">
                                                          <div className="flex justify-between items-center border-b border-gray-100 pb-1">
                                                              <span className="text-[10px] font-bold text-[#584235] uppercase tracking-widest">Skema Tarif / Harga Kamar</span>
                                                              <button 
                                                                  type="button" 
                                                                  onClick={() => {
                                                                      const currentPricing = temporaryRoom.pricing || [];
                                                                      const definedPeriods = currentPricing.map((p: any) => p.period);
                                                                      const nextPeriod = ['bulanan', 'tahunan', '6bulanan', '3bulanan', 'mingguan', 'harian'].find(p => !definedPeriods.includes(p)) || 'bulanan';
                                                                      const baseMonthlyPrice = Number(currentPricing.find((p: any) => p.period === 'bulanan')?.price) || Number(temporaryRoom.price) || 0;
                                                                      let defaultPrice = 0;
                                                                      if (nextPeriod === 'tahunan') defaultPrice = baseMonthlyPrice * 12;
                                                                      else if (nextPeriod === '6bulanan') defaultPrice = baseMonthlyPrice * 6;
                                                                      else if (nextPeriod === '3bulanan') defaultPrice = baseMonthlyPrice * 3;
                                                                      else defaultPrice = baseMonthlyPrice;

                                                                      setTemporaryRoom({
                                                                          ...temporaryRoom,
                                                                          pricing: [...currentPricing, { period: nextPeriod, price: defaultPrice || '' }]
                                                                      });
                                                                  }}
                                                                  className="text-[10px] font-bold text-[#ff7a00] hover:underline flex items-center gap-1"
                                                              >
                                                                  <Plus className="w-3.5 h-3.5 inline shrink-0" /> Tambah Skema Harga
                                                              </button>
                                                          </div>
                                                          
                                                          <div className="space-y-3">
                                                              {(() => {
                                                                  const pricing = temporaryRoom.pricing || [];
                                                                  const hasMonthly = pricing.some((p: any) => p.period === 'bulanan');
                                                                  if (!hasMonthly) {
                                                                      const monthlyPrice = temporaryRoom.price || '';
                                                                      temporaryRoom.pricing = [{ period: 'bulanan', price: monthlyPrice }, ...pricing];
                                                                  }
                                                                  return temporaryRoom.pricing.map((scheme: any, pIdx: number) => (
                                                                      <div key={pIdx} className="flex gap-2 items-center">
                                                                          <select
                                                                              value={scheme.period}
                                                                              onChange={(e) => {
                                                                                  const updatedPricing = [...temporaryRoom.pricing];
                                                                                  updatedPricing[pIdx] = { ...scheme, period: e.target.value };
                                                                                  setTemporaryRoom({ ...temporaryRoom, pricing: updatedPricing });
                                                                              }}
                                                                              className="bg-white border border-[#e0c0af] rounded-lg px-2 py-2 text-xs font-bold outline-none text-[#584235]"
                                                                          >
                                                                              <option value="bulanan">Bulanan</option>
                                                                              <option value="3bulanan">3 Bulan</option>
                                                                              <option value="6bulanan">6 Bulan</option>
                                                                              <option value="tahunan">Tahunan</option>
                                                                              <option value="mingguan">Mingguan</option>
                                                                              <option value="harian">Harian</option>
                                                                          </select>
                                                                          <div className="relative flex-grow">
                                                                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-bold">Rp</span>
                                                                              <input
                                                                                  type="text"
                                                                                   value={formatThousand(scheme.price)}
                                                                                   onChange={(e) => {
                                                                                       const val = parseThousand(e.target.value);
                                                                                      const updatedPricing = [...temporaryRoom.pricing];
                                                                                      updatedPricing[pIdx] = { ...scheme, price: val };
                                                                                      
                                                                                      let legacyPriceUpdate = {};
                                                                                      if (scheme.period === 'bulanan') {
                                                                                          legacyPriceUpdate = { price: val };
                                                                                      }
                                                                                      setTemporaryRoom({ ...temporaryRoom, ...legacyPriceUpdate, pricing: updatedPricing });
                                                                                  }}
                                                                                  className="w-full h-[36px] pl-8 pr-3 border border-[#e0c0af] rounded-lg text-xs bg-white text-gray-700 outline-none font-bold"
                                                                                  placeholder="Harga"
                                                                              />
                                                                          </div>
                                                                          {scheme.period !== 'bulanan' && (
                                                                              <button 
                                                                                  type="button" 
                                                                                  onClick={() => {
                                                                                      const updatedPricing = temporaryRoom.pricing.filter((_: any, idx: number) => idx !== pIdx);
                                                                                      setTemporaryRoom({ ...temporaryRoom, pricing: updatedPricing });
                                                                                  }}
                                                                                  className="text-red-500 hover:text-red-700 p-1"
                                                                              >
                                                                                  <Trash2 className="w-4 h-4 shrink-0" />
                                                                              </button>
                                                                          )}
                                                                      </div>
                                                                  ));
                                                              })()}
                                                          </div>
                                                          <p className="text-[10px] text-gray-400 leading-normal italic">
                                                              * Jika tarif Tahunan tidak diisi, tarif tahunan akan dihitung 12x tarif Bulanan secara default.
                                                          </p>

                                                           {/* Kelengkapan Penghuni & Biaya Lain */}
                                                           <div className="border-t border-gray-150 pt-4 mt-4 space-y-4">
                                                               <div className="grid grid-cols-2 gap-4">
                                                                   <div className="flex flex-col gap-1.5">
                                                                       <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Maks. Penghuni per Kamar</label>
                                                                       <div className="flex items-center gap-2">
                                                                           <input 
                                                                               type="number"
                                                                               min="1"
                                                                               value={temporaryRoom?.maxOccupants ?? ''}
                                                                               onChange={e => setTemporaryRoom({ ...temporaryRoom, maxOccupants: e.target.value === '' ? '' : (parseInt(e.target.value) || 1) })}
                                                                               className="w-full h-[36px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white text-gray-700 outline-none font-bold"
                                                                           />
                                                                           <span className="text-[10px] text-gray-500 font-bold uppercase">Orang</span>
                                                                       </div>
                                                                   </div>
                                                                   
                                                                   <div className="flex flex-col gap-1.5">
                                                                       <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Biaya Tambahan Orang (Rp/Bulan)</label>
                                                                       <div className="relative">
                                                                           <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-bold">Rp</span>
                                                                           <input 
                                                                               type="text"
                                                                               value={formatThousand(temporaryRoom?.extraOccupantFee || 0)}
                                                                               onChange={e => setTemporaryRoom({ ...temporaryRoom, extraOccupantFee: parseThousand(e.target.value) })}
                                                                               className="w-full h-[36px] pl-8 pr-3 border border-[#e0c0af] rounded-lg text-xs bg-white text-gray-700 outline-none font-bold"
                                                                               placeholder="0"
                                                                           />
                                                                       </div>
                                                                   </div>
                                                               </div>
                                                           </div>
                                                      </div>
                                                      {/* Fasilitas Kamar */}
                                                      <div className="border border-gray-150 rounded-xl p-4 flex flex-col gap-3.5 bg-gray-50/30">
                                                          <span className="text-[10px] font-bold text-[#584235] uppercase tracking-widest border-b border-gray-100 pb-1">Fasilitas Kamar</span>
                                                          
                                                          {/* Standard checklist (Kamar Mandi Dalam at the end) */}
                                                          <div className="grid grid-cols-2 gap-y-3.5 gap-x-2">
                                                              {(() => {
                                                                  const current = temporaryRoom.roomFacilities || [];
                                                                  const isKosongan = current.includes('Kosongan (Tanpa Perabot)');
                                                                  return (
                                                                      <div className="col-span-2 flex bg-gray-100 p-1 rounded-xl gap-1 mb-2 border border-gray-200/80">
                                                                          <button
                                                                              type="button"
                                                                              onClick={() => {
                                                                                  const cleared = current.filter((f: string) => !['Kasur', 'Lemari', 'Meja Belajar', 'AC', 'Kipas Angin', 'Water Heater'].includes(f));
                                                                                  if (!cleared.includes('Kosongan (Tanpa Perabot)')) {
                                                                                      cleared.push('Kosongan (Tanpa Perabot)');
                                                                                  }
                                                                                  updateTemporaryRoomFacilitiesWithPhotos(cleared);
                                                                              }}
                                                                              className={`flex-1 py-2 rounded-lg text-[10px] uppercase tracking-wider font-black transition-all flex items-center justify-center gap-1.5 ${isKosongan ? 'bg-[#ff7a00] text-white shadow-sm scale-[1.02]' : 'text-gray-500 hover:text-gray-700'}`}
                                                                          >
                                                                              <AlertCircle className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                                              Kosongan (Tanpa Perabot)
                                                                          </button>
                                                                          <button
                                                                              type="button"
                                                                              onClick={() => {
                                                                                  const cleared = current.filter((f: string) => f !== 'Kosongan (Tanpa Perabot)');
                                                                                  updateTemporaryRoomFacilitiesWithPhotos(cleared);
                                                                              }}
                                                                              className={`flex-1 py-2 rounded-lg text-[10px] uppercase tracking-wider font-black transition-all flex items-center justify-center gap-1.5 ${!isKosongan ? 'bg-[#ff7a00] text-white shadow-sm scale-[1.02]' : 'text-gray-500 hover:text-gray-700'}`}
                                                                          >
                                                                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                                                              Furnished (Isian)
                                                                          </button>
                                                                      </div>
                                                                  );
                                                              })()}

                                                              {['Kasur', 'Lemari', 'Meja Belajar', 'AC', 'Kipas Angin', 'Water Heater', 'Jendela Luar', 'Kamar Mandi Dalam', 'Dapur Dalam'].map(fac => {
                                                                  const isChecked = temporaryRoom.roomFacilities?.includes(fac);
                                                                  const isPerabot = ['Kasur', 'Lemari', 'Meja Belajar', 'AC', 'Kipas Angin', 'Water Heater'].includes(fac);
                                                                  const isKosongan = temporaryRoom.roomFacilities?.includes('Kosongan (Tanpa Perabot)');
                                                                  const isDisabled = isPerabot && isKosongan;
                                                                  return (
                                                                      <React.Fragment key={fac}>
                                                                          <label className={`flex items-center gap-2.5 cursor-pointer transition-all ${isDisabled ? 'opacity-40 pointer-events-none' : ''}`}>
                                                                              <input 
                                                                                  type="checkbox"
                                                                                  checked={isChecked && !isDisabled}
                                                                                  disabled={isDisabled}
                                                                                  onChange={() => {
                                                                                      const current = temporaryRoom.roomFacilities || [];
                                                                                      const updated = current.includes(fac)
                                                                                          ? current.filter((f: string) => f !== fac)
                                                                                          : [...current, fac];
                                                                                      updateTemporaryRoomFacilitiesWithPhotos(updated);
                                                                                  }}
                                                                                  className="rounded border-[#e0c0af] text-[#ff7a00] focus:ring-[#ff7a00] w-5 h-5"
                                                                              />
                                                                              <span className="text-xs text-gray-700 uppercase tracking-wider font-semibold">{fac}</span>
                                                                          </label>

                                                                          {fac === 'Kamar Mandi Dalam' && isChecked && (
                                                                              <div className="col-span-2 pl-6 mt-1.5 border-l-2 border-[#ff7a00] flex flex-col gap-2 bg-orange-50/30 p-3 rounded-xl animate-fadeIn">
                                                                                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider mb-0.5">Kelengkapan Kamar Mandi Dalam:</span>
                                                                                  <div className="grid grid-cols-2 gap-2.5">
                                                                                      {['Kloset Duduk', 'Kloset Jongkok', 'Shower', 'Wastafel'].map(bfac => {
                                                                                          const isBChecked = temporaryRoom.bathroomFacilities?.includes(bfac);
                                                                                          return (
                                                                                              <label key={bfac} className="flex items-center gap-2 cursor-pointer">
                                                                                                  <input 
                                                                                                      type="checkbox"
                                                                                                      checked={isBChecked}
                                                                                                      onChange={() => {
                                                                                                          const current = temporaryRoom.bathroomFacilities || [];
                                                                                                          const updated = current.includes(bfac)
                                                                                                              ? current.filter((f: string) => f !== bfac)
                                                                                                              : [...current, bfac];
                                                                                                          setTemporaryRoom({ ...temporaryRoom, bathroomFacilities: updated });
                                                                                                      }}
                                                                                                      className="rounded border-[#e0c0af] text-[#ff7a00] focus:ring-[#ff7a00] w-4.5 h-4.5"
                                                                                                  />
                                                                                                  <span className="text-xs text-gray-600 uppercase tracking-wider font-bold">{bfac}</span>
                                                                                              </label>
                                                                                          );
                                                                                      })}
                                                                                      {(() => {
                                                                                          const bCustoms = temporaryRoom.bathroomFacilities?.filter((f: string) => !['Kloset Duduk', 'Kloset Jongkok', 'Shower', 'Wastafel'].includes(f)) || [];
                                                                                          if (bCustoms.length === 0) return null;
                                                                                          return (
                                                                                              <div className="col-span-2 flex flex-wrap gap-1 mt-1 border-t border-orange-100 pt-2">
                                                                                                  {bCustoms.map((fac: string) => (
                                                                                                      <span key={fac} className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-[#ff7a00] text-[9px] font-black rounded uppercase tracking-wider">
                                                                                                          {fac}
                                                                                                          <button 
                                                                                                              type="button" 
                                                                                                              onClick={() => {
                                                                                                                  const current = temporaryRoom.bathroomFacilities || [];
                                                                                                                  setTemporaryRoom({ ...temporaryRoom, bathroomFacilities: current.filter((f: string) => f !== fac) });
                                                                                                              }}
                                                                                                              className="hover:text-orange-700 text-xs font-bold leading-none p-0.5"
                                                                                                          >
                                                                                                              &times;
                                                                                                          </button>
                                                                                                      </span>
                                                                                                  ))}
                                                                                              </div>
                                                                                          );
                                                                                      })()}
                                                                                      <div className="col-span-2 flex gap-1.5 mt-1 border-t border-orange-100 pt-2">
                                                                                          <input 
                                                                                              type="text" 
                                                                                              value={customBathroomFacilityInput} 
                                                                                              onChange={e => setCustomBathroomFacilityInput(e.target.value)} 
                                                                                              placeholder="Tambah kelengkapan WC..." 
                                                                                              className="flex-grow h-[28px] px-2 border border-[#e0c0af] rounded text-[11px] bg-white outline-none text-[#584235] font-bold"
                                                                                          />
                                                                                          <button 
                                                                                              type="button"
                                                                                              onClick={() => {
                                                                                                  if (!customBathroomFacilityInput.trim()) return;
                                                                                                  const current = temporaryRoom.bathroomFacilities || [];
                                                                                                  if (!current.includes(customBathroomFacilityInput.trim())) {
                                                                                                      setTemporaryRoom({ ...temporaryRoom, bathroomFacilities: [...current, customBathroomFacilityInput.trim()] });
                                                                                                  }
                                                                                                  setCustomBathroomFacilityInput('');
                                                                                              }}
                                                                                              className="h-[28px] px-3 bg-[#ff7a00] hover:bg-orange-600 text-white font-bold text-[10px] uppercase rounded flex items-center justify-center transition-colors shadow-sm"
                                                                                          >
                                                                                              +
                                                                                          </button>
                                                                                      </div>
                                                                                  </div>
                                                                              </div>
                                                                          )}

                                                                          {fac === 'Dapur Dalam' && isChecked && (
                                                                              <div className="col-span-2 pl-6 mt-1.5 border-l-2 border-[#ff7a00] flex flex-col gap-2 bg-orange-50/30 p-3 rounded-xl w-full animate-fadeIn">
                                                                                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider mb-0.5">Kelengkapan Dapur Dalam:</span>
                                                                                  <div className="grid grid-cols-2 gap-2.5">
                                                                                      {['Kompor', 'Kulkas', 'Wastafel Cuci Piring', 'Kitchen Set', 'Dispenser'].map(kfac => {
                                                                                          const isKChecked = temporaryRoom.kitchenFacilities?.includes(kfac);
                                                                                          return (
                                                                                              <label key={kfac} className="flex items-center gap-2 cursor-pointer">
                                                                                                  <input 
                                                                                                      type="checkbox"
                                                                                                      checked={!!isKChecked}
                                                                                                      onChange={() => {
                                                                                                          const current = temporaryRoom.kitchenFacilities || [];
                                                                                                          const updated = current.includes(kfac)
                                                                                                              ? current.filter((f: string) => f !== kfac)
                                                                                                              : [...current, kfac];
                                                                                                          setTemporaryRoom({ ...temporaryRoom, kitchenFacilities: updated });
                                                                                                      }}
                                                                                                      className="rounded border-[#e0c0af] text-[#ff7a00] focus:ring-[#ff7a00] w-4.5 h-4.5"
                                                                                                  />
                                                                                                  <span className="text-[11px] text-gray-650 font-bold uppercase">{kfac}</span>
                                                                                              </label>
                                                                                          );
                                                                                      })}
                                                                                  </div>
                                                                                  {temporaryRoom.kitchenFacilities?.filter((f: string) => !['Kompor', 'Kulkas', 'Wastafel Cuci Piring', 'Kitchen Set', 'Dispenser'].includes(f)).length > 0 && (
                                                                                      <div className="flex flex-wrap gap-1.5 mt-1 border-t border-orange-100 pt-2">
                                                                                          {temporaryRoom.kitchenFacilities.filter((f: string) => !['Kompor', 'Kulkas', 'Wastafel Cuci Piring', 'Kitchen Set', 'Dispenser'].includes(f)).map((fac: string) => (
                                                                                              <span key={fac} className="bg-orange-100 text-[#ff7a00] px-2 py-0.5 rounded-full text-[9px] font-black uppercase flex items-center gap-1">
                                                                                                  {fac}
                                                                                                  <button
                                                                                                      type="button"
                                                                                                      onClick={() => {
                                                                                                          const current = temporaryRoom.kitchenFacilities || [];
                                                                                                          setTemporaryRoom({ ...temporaryRoom, kitchenFacilities: current.filter((f: string) => f !== fac) });
                                                                                                      }}
                                                                                                      className="text-red-600 hover:text-red-850 font-bold text-xs"
                                                                                                  >
                                                                                                      &times;
                                                                                                  </button>
                                                                                              </span>
                                                                                          ))}
                                                                                      </div>
                                                                                  )}
                                                                                  <div className="flex gap-2 mt-1.5 border-t border-orange-100 pt-2">
                                                                                      <input 
                                                                                          type="text" 
                                                                                          placeholder="Tambah kelengkapan dapur..." 
                                                                                          value={customKitchenFacilityInput} 
                                                                                          onChange={e => setCustomKitchenFacilityInput(e.target.value)} 
                                                                                          className="flex-grow h-[28px] px-2 border border-[#e0c0af] rounded text-[11px] bg-white outline-none text-[#584235] font-bold"
                                                                                      />
                                                                                      <button 
                                                                                          type="button" 
                                                                                          onClick={() => {
                                                                                              if (!customKitchenFacilityInput.trim()) return;
                                                                                              const current = temporaryRoom.kitchenFacilities || [];
                                                                                              if (!current.includes(customKitchenFacilityInput.trim())) {
                                                                                                  setTemporaryRoom({ ...temporaryRoom, kitchenFacilities: [...current, customKitchenFacilityInput.trim()] });
                                                                                              }
                                                                                              setCustomKitchenFacilityInput('');
                                                                                          }}
                                                                                          className="h-[28px] px-3 bg-[#ff7a00] hover:bg-orange-600 text-white font-bold text-[10px] uppercase rounded flex items-center justify-center transition-colors shadow-sm"
                                                                                      >
                                                                                          +
                                                                                      </button>
                                                                                  </div>
                                                                              </div>
                                                                          )}
                                                                      </React.Fragment>
                                                                  );
                                                              })}
                                                          </div>

                                                          {/* Removable Custom Badges */}
                                                          {(() => {
                                                              const customs = temporaryRoom.roomFacilities?.filter((f: string) => !['Kasur', 'Lemari', 'Meja Belajar', 'AC', 'Kipas Angin', 'Kamar Mandi Dalam', 'Water Heater', 'Jendela Luar', 'Dapur Dalam'].includes(f)) || [];
                                                              if (customs.length === 0) return null;
                                                              return (
                                                                  <div className="flex flex-wrap gap-1.5 mt-1 border-t border-gray-100 pt-3">
                                                                      {customs.map((fac: string) => (
                                                                          <span key={fac} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-orange-50 text-[#ff7a00] text-[10px] font-black rounded-lg border border-orange-100 uppercase tracking-wider">
                                                                              {fac}
                                                                              <button 
                                                                                  type="button" 
                                                                                  onClick={() => {
                                                                                      const current = temporaryRoom.roomFacilities || [];
                                                                                      updateTemporaryRoomFacilitiesWithPhotos(current.filter((f: string) => f !== fac));
                                                                                  }}
                                                                                  className="hover:text-orange-700 text-xs font-bold leading-none p-0.5"
                                                                              >
                                                                                  &times;
                                                                              </button>
                                                                          </span>
                                                                      ))}
                                                                  </div>
                                                              );
                                                          })()}

                                                          {/* Custom Facility Adder Input */}
                                                          <div className="flex gap-2 mt-1 border-t border-gray-100 pt-3">
                                                              <input 
                                                                  type="text" 
                                                                  value={customRoomFacilityInput} 
                                                                  onChange={e => setCustomRoomFacilityInput(e.target.value)} 
                                                                  placeholder="Tambah fasilitas kustom..." 
                                                                  className="flex-grow h-[36px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white outline-none text-[#584235] font-bold"
                                                              />
                                                              <button 
                                                                  type="button"
                                                                  onClick={() => {
                                                                      if (!customRoomFacilityInput.trim()) return;
                                                                      const current = temporaryRoom.roomFacilities || [];
                                                                      if (!current.includes(customRoomFacilityInput.trim())) {
                                                                          updateTemporaryRoomFacilitiesWithPhotos([...current, customRoomFacilityInput.trim()]);
                                                                      }
                                                                      setCustomRoomFacilityInput('');
                                                                  }}
                                                                  className="h-[36px] px-4 bg-[#ff7a00] hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center transition-colors shadow-sm"
                                                              >
                                                                  Tambah
                                                              </button>
                                                          </div>

                                                           {/* Biaya Tambahan Bulanan Lainnya */}
                                                           <div className="border border-gray-150 rounded-xl p-4 flex flex-col gap-3.5 bg-gray-50/30">
                                                              <span className="text-[10px] font-bold text-[#584235] uppercase tracking-widest border-b border-gray-100 pb-1">Biaya Tambahan Bulanan Lainnya</span>
                                                              
                                                              <div className="flex flex-col gap-1.5">
                                                                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Nominal Biaya Tambahan Bulanan (Rp/Bulan)</label>
                                                                  <div className="relative">
                                                                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-bold">Rp</span>
                                                                      <input 
                                                                          type="text"
                                                                          value={formatThousand(temporaryRoom?.otherFeeAmount || 0)}
                                                                          onChange={e => setTemporaryRoom({ ...temporaryRoom, otherFeeAmount: parseThousand(e.target.value) })}
                                                                          className="w-full h-[36px] pl-8 pr-3 border border-[#e0c0af] rounded-lg text-xs bg-white text-gray-700 outline-none font-bold"
                                                                          placeholder="0"
                                                                      />
                                                                  </div>
                                                              </div>

                                                              <div className="flex flex-col gap-1.5 mt-1">
                                                                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Cakupan Biaya Tambahan</label>
                                                                  <div className="grid grid-cols-2 gap-2">
                                                                      {['Listrik', 'Air', 'Sampah', 'Wifi', 'Keamanan/Parkir'].map(feeName => {
                                                                          const isChecked = temporaryRoom?.otherFeeCoveredItems?.includes(feeName);
                                                                          return (
                                                                              <label key={feeName} className="flex items-center gap-2 cursor-pointer p-2.5 bg-white border border-[#e0c0af] rounded-lg shadow-sm">
                                                                                  <input 
                                                                                      type="checkbox"
                                                                                      checked={!!isChecked}
                                                                                      onChange={() => {
                                                                                          const current = temporaryRoom?.otherFeeCoveredItems || [];
                                                                                          const updated = current.includes(feeName)
                                                                                              ? current.filter((item: string) => item !== feeName)
                                                                                              : [...current, feeName];
                                                                                          setTemporaryRoom({ ...temporaryRoom, otherFeeCoveredItems: updated });
                                                                                      }}
                                                                                      className="rounded border-[#e0c0af] text-[#ff7a00] focus:ring-[#ff7a00] w-4.5 h-4.5"
                                                                                  />
                                                                                  <span className="text-[10px] font-bold text-gray-650 uppercase tracking-wider">{feeName}</span>
                                                                              </label>
                                                                          );
                                                                      })}
                                                                  </div>
                                                              </div>
                                                           </div>
                                                      </div>

                                                                {/* Dokumentasi Foto Kamar */}
                                                                <div className="border border-gray-150 rounded-xl p-4 flex flex-col gap-3.5 bg-gray-50/30">
                                                                    <div className="flex justify-between items-center border-b border-gray-100 pb-1.5">
                                                                        <span className="text-[10px] font-bold text-[#584235] uppercase tracking-widest">Dokumentasi Foto Kamar</span>
                                                                    </div>
                                                                    {(() => {
                                                                        const standardKnown = ['Interior Kamar *Wajib', 'Interior Kamar (Opsional)', 'Kamar Mandi', 'Dapur Dalam', 'Tempat Tidur', 'Lemari / Storage', 'Meja Belajar', 'AC', 'Kipas Angin', 'Jendela Luar', 'Water Heater'];
                                                                        const currentCategorized = getRoomCategorizedPhotos(temporaryRoom);
                                                                        const existingCustomKeys = Object.keys(currentCategorized).filter((c: string) => !standardKnown.includes(c));
                                                                        const dynamicCats = computeDynamicRoomPhotoCategories(temporaryRoom.roomFacilities || [], temporaryRoom.status || 'Kosong', existingCustomKeys);

                                                                        const getPhotoCaption = (cLabel: string, pIdx: number) => {
                                                                            const clean = cLabel.replace(/(\*Wajib|\(Opsional\))/gi, '').trim();
                                                                            return clean.toLowerCase().includes('interior') ? `Interior ${pIdx + 1}` : `${clean} ${pIdx + 1}`;
                                                                        };

                                                                        return (
                                                                            <div className="space-y-3">
                                                                                {dynamicCats.map((rawLabel: string) => {
                                                                                    const label = (rawLabel === 'Interior Kamar *Wajib' && temporaryRoom.status === 'Terisi') ? 'Interior Kamar (Opsional)' : rawLabel;
                                                                                    const catPhotos = currentCategorized[rawLabel] 
                                                                                        || (rawLabel.includes('Interior') ? (currentCategorized['Interior Kamar *Wajib'] || currentCategorized['Interior Kamar (Opsional)'] || []) : []) 
                                                                                        || [];

                                                                                    return (
                                                                                        <div key={rawLabel} className="bg-white border border-[#e0c0af]/60 rounded-xl p-3 shadow-xs space-y-2.5">
                                                                                            <div className="flex justify-between items-center">
                                                                                                <div className="flex items-center gap-1.5">
                                                                                                    {rawLabel.includes('Interior') ? <Home className="w-3.5 h-3.5 text-[#ff7a00] shrink-0" /> :
                                                                                                          rawLabel.includes('Mandi') ? <Bath className="w-3.5 h-3.5 text-[#ff7a00] shrink-0" /> :
                                                                                                          rawLabel.includes('Tidur') ? <Bed className="w-3.5 h-3.5 text-[#ff7a00] shrink-0" /> :
                                                                                                          rawLabel.includes('AC') ? <Fan className="w-3.5 h-3.5 text-[#ff7a00] shrink-0" /> :
                                                                                                          <Camera className="w-3.5 h-3.5 text-[#ff7a00] shrink-0" />}
                                                                                                    <span className="text-[11px] font-bold text-[#584235] uppercase tracking-wider">{label}</span>
                                                                                                </div>
                                                                                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${catPhotos.length > 0 ? 'bg-orange-100 text-[#ff7a00]' : 'bg-gray-100 text-gray-500'}`}>
                                                                                                    {catPhotos.length} Foto
                                                                                                </span>
                                                                                            </div>

                                                                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                                                                {catPhotos.map((url, pIdx) => (
                                                                                                    <div key={`${url}_${pIdx}`} className="aspect-video w-full rounded-lg overflow-hidden border border-gray-200 relative group bg-gray-50">
                                                                                                        <img src={url} alt={getPhotoCaption(label, pIdx)} className="w-full h-full object-cover" />
                                                                                                        <button
                                                                                                            type="button"
                                                                                                            onClick={() => {
                                                                                                                const updatedCategorized = { ...currentCategorized };
                                                                                                                const targetKey = Object.keys(updatedCategorized).find(k => k === rawLabel || (rawLabel.includes('Interior') && k.includes('Interior'))) || rawLabel;
                                                                                                                const list = [...(updatedCategorized[targetKey] || [])];
                                                                                                                list.splice(pIdx, 1);
                                                                                                                if (list.length > 0) {
                                                                                                                    updatedCategorized[targetKey] = list;
                                                                                                                } else {
                                                                                                                    delete updatedCategorized[targetKey];
                                                                                                                }
                                                                                                                const { images, photoCategories } = exportCategorizedPhotos(updatedCategorized);
                                                                                                                setTemporaryRoom({ 
                                                                                                                    ...temporaryRoom, 
                                                                                                                    categorized_photos: updatedCategorized,
                                                                                                                    categorizedPhotos: updatedCategorized,
                                                                                                                    images,
                                                                                                                    photoCategories
                                                                                                                });
                                                                                                            }}
                                                                                                            className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow-md transition-all active:scale-90"
                                                                                                            title="Hapus foto ini"
                                                                                                        >
                                                                                                            &times;
                                                                                                        </button>
                                                                                                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 py-0.5 px-1 text-[8px] text-white text-center uppercase font-bold tracking-wider truncate">
                                                                                                            {getPhotoCaption(label, pIdx)}
                                                                                                        </div>
                                                                                                    </div>
                                                                                                ))}

                                                                                                <div 
                                                                                                    onClick={async () => {
                                                                                                        const input = document.createElement('input');
                                                                                                        input.type = 'file';
                                                                                                        input.accept = 'image/*';
                                                                                                        input.multiple = true;
                                                                                                        input.onchange = async (e: any) => {
                                                                                                            const files = e.target?.files;
                                                                                                            if (files && files.length > 0) {
                                                                                                                const uploadKey = `temp_${rawLabel}`;
                                                                                                                setUploadingRooms(prev => ({ ...prev, [uploadKey]: true }));
                                                                                                                try {
                                                                                                                    const newUrls = [];
                                                                                                                    for (let f = 0; f < files.length; f++) {
                                                                                                                        const folder = `kostmanager/rooms/${Date.now()}_${f}`;
                                                                                                                        const publicUrl = await uploadFileAndGetURL(files[f], folder);
                                                                                                                        newUrls.push(publicUrl);
                                                                                                                    }
                                                                                                                    const updatedCategorized = { ...currentCategorized };
                                                                                                                    const targetKey = rawLabel.includes('Interior') ? (temporaryRoom.status === 'Terisi' ? 'Interior Kamar (Opsional)' : 'Interior Kamar *Wajib') : rawLabel;
                                                                                                                    const list = [...(updatedCategorized[targetKey] || [])];
                                                                                                                    newUrls.forEach(u => list.push(u));
                                                                                                                    updatedCategorized[targetKey] = list;
                                                                                                                    const { images, photoCategories } = exportCategorizedPhotos(updatedCategorized);
                                                                                                                    setTemporaryRoom({ 
                                                                                                                        ...temporaryRoom, 
                                                                                                                        categorized_photos: updatedCategorized,
                                                                                                                        categorizedPhotos: updatedCategorized,
                                                                                                                        images,
                                                                                                                        photoCategories
                                                                                                                    });
                                                                                                                } catch (err) {
                                                                                                                    alert('Gagal unggah foto: ' + (err as Error).message);
                                                                                                                } finally {
                                                                                                                    setUploadingRooms(prev => ({ ...prev, [uploadKey]: false }));
                                                                                                                }
                                                                                                            }
                                                                                                        };
                                                                                                        input.click();
                                                                                                    }}
                                                                                                    className={`aspect-video bg-white border-2 border-dashed border-[#ff7a00] rounded-lg flex flex-col items-center justify-center p-2 cursor-pointer hover:bg-orange-50/50 transition-all text-[#584235] ${catPhotos.length === 0 ? 'col-span-2 sm:col-span-3 py-4' : ''}`}
                                                                                                >
                                                                                                    {uploadingRooms[`temp_${rawLabel}`] ? (
                                                                                                        <span className="text-[10px] font-bold animate-pulse text-gray-500">Uploading...</span>
                                                                                                    ) : (
                                                                                                        <>
                                                                                                            <ImagePlus className="w-5 h-5 text-[#ff7a00] shrink-0" />
                                                                                                            <span className="text-[9px] font-bold uppercase tracking-wider mt-0.5 text-center">
                                                                                                                {catPhotos.length === 0 ? `+ Unggah Foto ${label.replace(/(\*Wajib|\(Opsional\))/gi, '').trim()}` : '+ Tambah Foto'}
                                                                                                            </span>
                                                                                                        </>
                                                                                                    )}
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                        );
                                                                    })()}
                                                                   
                                                                   {/* Input Kategori Tambahan Kamar */}
                                                                   <div className="flex gap-2 mt-2">
                                                                       <input 
                                                                           type="text" 
                                                                           placeholder="Kategori Foto Kamar Baru (misal: Balkon Kamar)" 
                                                                           value={newRoomPhotoCategoryName} 
                                                                           onChange={e => setNewRoomPhotoCategoryName(e.target.value)} 
                                                                           className="flex-1 h-[36px] px-3 border border-gray-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-orange-500 bg-white" 
                                                                       />
                                                                       <button 
                                                                           type="button" 
                                                                           onClick={() => {
                                                                               if (!newRoomPhotoCategoryName.trim()) return;
                                                                               const cat = newRoomPhotoCategoryName.trim();
                                                                               const updatedCategorized = getRoomCategorizedPhotos(temporaryRoom);
                                                                               if (!updatedCategorized[cat]) {
                                                                                   updatedCategorized[cat] = [];
                                                                               }
                                                                               const { images, photoCategories } = exportCategorizedPhotos(updatedCategorized);
                                                                               setTemporaryRoom({
                                                                                   ...temporaryRoom,
                                                                                   categorized_photos: updatedCategorized,
                                                                                   categorizedPhotos: updatedCategorized,
                                                                                   images,
                                                                                   photoCategories
                                                                               });
                                                                               setNewRoomPhotoCategoryName('');
                                                                           }} 
                                                                           className="bg-[#eff4ff] hover:bg-[#dce9ff] text-[#ff7a00] font-bold text-xs uppercase px-4 rounded-lg border border-[#e0c0af] transition-colors"
                                                                       >
                                                                           + Kategori Kamar
                                                                       </button>
                                                                   </div>
                                                               </div>
                                                        {temporaryRoom.status === 'Terisi' && (
                                                           <>
                                                              <div className="border border-gray-150 rounded-xl p-4 flex flex-col gap-3.5 bg-gray-50/30">
                                                                  <span className="text-[10px] font-bold text-[#584235] uppercase tracking-widest border-b border-gray-100 pb-1">Informasi Penghuni</span>
                                                                  <div className="flex flex-col gap-3">
                                                                      <div className="flex flex-col gap-1">
                                                                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Nama Penghuni</label>
                                                                          <input 
                                                                              type="text"
                                                                              value={temporaryRoom.residentName || ''}
                                                                              onChange={e => setTemporaryRoom({ ...temporaryRoom, residentName: e.target.value })}
                                                                              className="w-full h-[40px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white text-gray-700 outline-none font-bold"
                                                                              placeholder="Nama Lengkap Penghuni"
                                                                          />
                                                                      </div>
                                                                      <div className="flex flex-col gap-1">
                                                                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Nomor HP / WhatsApp</label>
                                                                          <input 
                                                                              type="text"
                                                                              value={temporaryRoom.residentPhone || ''}
                                                                              onChange={e => setTemporaryRoom({ ...temporaryRoom, residentPhone: e.target.value })}
                                                                              className="w-full h-[40px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white text-gray-700 outline-none"
                                                                              placeholder="contoh: 08123456789"
                                                                          />
                                                                      </div>
                                                                        <div className="flex flex-col gap-1">
                                                                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Jenis Langganan</label>
                                                                            {(() => {
                                                                                const { amount, unit } = parsePaymentPeriod(temporaryRoom.paymentPeriod || 'bulanan');
                                                                                return (
                                                                                    <div className="flex gap-2">
                                                                                        <input 
                                                                                            type="number"
                                                                                            min="1"
                                                                                            value={amount}
                                                                                            onChange={e => {
                                                                                                const val = parseInt(e.target.value) || 1;
                                                                                                setTemporaryRoom({ ...temporaryRoom, paymentPeriod: `${val} ${unit}` });
                                                                                            }}
                                                                                            className="w-20 h-[40px] px-2.5 border border-[#e0c0af] rounded-lg text-xs bg-white text-gray-700 outline-none font-bold"
                                                                                        />
                                                                                        <select 
                                                                                            value={unit}
                                                                                            onChange={e => setTemporaryRoom({ ...temporaryRoom, paymentPeriod: `${amount} ${e.target.value}` })}
                                                                                            className="flex-grow h-[40px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white text-gray-700 outline-none font-bold"
                                                                                        >
                                                                                            <option value="hari">Hari</option>
                                                                                            <option value="minggu">Minggu</option>
                                                                                            <option value="bulan">Bulan</option>
                                                                                            <option value="tahun">Tahun</option>
                                                                                        </select>
                                                                                    </div>
                                                                                );
                                                                            })()}
                                                                        </div>
                                                                       <div className="grid grid-cols-2 gap-2">
                                                                           <div className="flex flex-col gap-1">
                                                                               <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider font-semibold">Tanggal Pembayaran Terakhir</label>
                                                                               <input 
                                                                                   type="date"
                                                                                   value={temporaryRoom.startDate || ''}
                                                                                   onChange={e => setTemporaryRoom({ ...temporaryRoom, startDate: e.target.value })}
                                                                                   className="w-full h-[40px] px-2 border border-[#e0c0af] rounded-lg text-xs bg-white text-gray-700 outline-none font-bold"
                                                                               />
                                                                           </div>
                                                                           <div className="flex flex-col gap-1">
                                                                               <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider font-semibold">Tagihan Berikutnya</label>
                                                                               <input 
                                                                                   type="date"
                                                                                   value={temporaryRoom.endDate || ''}
                                                                                   onChange={e => setTemporaryRoom({ ...temporaryRoom, endDate: e.target.value })}
                                                                                   className="w-full h-[40px] px-2 border border-[#e0c0af] rounded-lg text-xs bg-white text-gray-700 outline-none font-bold"
                                                                               />
                                                                           </div>
                                                                       </div>

                                                                        <div className="flex flex-col gap-1">
                                                                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Jumlah Penghuni Saat Ini</label>
                                                                            <div className="flex items-center gap-2">
                                                                                <input 
                                                                                    type="number"
                                                                                    min="1"
                                                                                    value={temporaryRoom.currentOccupants ?? 1}
                                                                                    onChange={e => {
                                                                                        const val = e.target.value === '' ? '' : (parseInt(e.target.value) || 1);
                                                                                        setTemporaryRoom({ ...temporaryRoom, currentOccupants: val });
                                                                                    }}
                                                                                    className="w-full h-[40px] px-3 border border-[#e0c0af] rounded-lg text-xs bg-white text-gray-700 outline-none font-bold"
                                                                                    placeholder="Jumlah penghuni saat ini"
                                                                                />
                                                                                <span className="text-xs font-bold text-gray-500 uppercase">Orang</span>
                                                                            </div>
                                                                        </div>

                                                                        {/* Additional occupants sub-inputs if currentOccupants > 1 */}
                                                                        {Array.from({ length: Math.max(0, (temporaryRoom.currentOccupants || 1) - 1) }).map((_, idx) => {
                                                                            const occupant = (temporaryRoom.additionalOccupants || [])[idx] || { name: '', phone: '' };
                                                                            return (
                                                                                <div key={idx} className="col-span-2 pl-4 mt-2 border-l-2 border-[#ff7a00] flex flex-col gap-2 bg-[#fffaf5] p-3 rounded-lg w-full">
                                                                                    <span className="text-[10px] font-black text-[#ff7a00] uppercase tracking-wider">Anggota Penghuni {idx + 2}</span>
                                                                                    <div className="grid grid-cols-2 gap-2.5">
                                                                                        <div className="flex flex-col gap-1">
                                                                                            <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Nama Lengkap</label>
                                                                                            <input 
                                                                                                type="text"
                                                                                                value={occupant.name || ''}
                                                                                                onChange={e => {
                                                                                                    const updatedList = [...(temporaryRoom.additionalOccupants || [])];
                                                                                                    while (updatedList.length <= idx) updatedList.push({ name: '', phone: '' });
                                                                                                    updatedList[idx] = { ...updatedList[idx], name: e.target.value };
                                                                                                    setTemporaryRoom({ ...temporaryRoom, additionalOccupants: updatedList });
                                                                                                }}
                                                                                                className="w-full h-[36px] px-2.5 border border-[#e0c0af] rounded-lg text-xs bg-white text-gray-755 outline-none font-bold"
                                                                                                placeholder="Nama Lengkap"
                                                                                            />
                                                                                        </div>
                                                                                        <div className="flex flex-col gap-1">
                                                                                            <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">No. WhatsApp</label>
                                                                                            <input 
                                                                                                type="text"
                                                                                                value={occupant.phone || ''}
                                                                                                onChange={e => {
                                                                                                    const updatedList = [...(temporaryRoom.additionalOccupants || [])];
                                                                                                    while (updatedList.length <= idx) updatedList.push({ name: '', phone: '' });
                                                                                                    updatedList[idx] = { ...updatedList[idx], phone: e.target.value };
                                                                                                    setTemporaryRoom({ ...temporaryRoom, additionalOccupants: updatedList });
                                                                                                }}
                                                                                                className="w-full h-[36px] px-2.5 border border-[#e0c0af] rounded-lg text-xs bg-white text-gray-755 outline-none"
                                                                                                placeholder="08xxxxxxxx"
                                                                                            />
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })}

                                                                  </div>
                                                              </div>
                                                               </>
                                                           )}
                                                           
                                                              {/* Save Button for New Room */}
                                                              <button 
                                                                  type="button"
                                                                  onClick={async () => {
                                                                      if (!temporaryRoom.name.trim()) {
                                                                          alert('Silakan isi nomor kamar terlebih dahulu.');
                                                                          return;
                                                                      }
                                                                      const updatedForm = {
                                                                          ...kmListingForm,
                                                                          roomTypes: [...(kmListingForm.roomTypes || []), temporaryRoom]
                                                                      };
                                                                      setKmListingForm(updatedForm);
                                                                      setTemporaryRoom(null);
                                                                      alert('Kamar baru berhasil disimpan ke daftar!');
                                                                      await handleSaveDraftDirectly(updatedForm, true);
                                                                  }}
                                                                  className="w-full h-[40px] bg-[#ff7a00] hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center transition-colors shadow-sm"
                                                              >
                                                                  Simpan Kamar Baru
                                                              </button>
                                                          </>
                                                      )}
                                                  </div>
                                              </div>
                                                );
                                            })()}
                                        </div>
                                    );
                                })()}

                                 {/* STEP 3: REVIEW */}
                                {kmStep === 3 && (() => {
                                    const currentEvalData = parseEvaluationData(isEditingKostManager?.notes, isEditingKostManager?.status);

                                    return (
                                        <div className="space-y-6">
                                            {/* Step 3 Revision Top Banner */}
                                            {currentEvalData.hasRevision && currentEvalData.hasPartner && (
                                                <div className="relative overflow-hidden rounded-2xl border-2 border-amber-400 bg-gradient-to-br from-amber-500/[0.08] via-orange-500/[0.03] to-amber-500/[0.08] p-3.5 shadow-[0_0_20px_rgba(245,158,11,0.15)] flex items-center justify-between gap-3 animate-fadeIn">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-xs shrink-0 animate-bounce">
                                                            <AlertTriangle size={16} />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-black text-amber-950 uppercase tracking-wider">
                                                                Data Mitra / Tanda Tangan Perlu Direvisi
                                                            </p>
                                                            <p className="text-[10px] font-bold text-amber-700">
                                                                Periksa kesepakatan kerjasama atau perbarui tanda tangan digital pemilik di bawah.
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <span className="px-2 py-0.5 rounded-full bg-amber-200/90 text-amber-900 border border-amber-300 text-[9px] font-black uppercase tracking-wider animate-pulse">
                                                        ✨ Evaluasi Mitra
                                                    </span>
                                                </div>
                                            )}

                                            {/* Data Pemilik / Mitra */}
                                        <section className="bg-white border border-[#e0c0af] rounded-2xl p-5 flex flex-col gap-4 shadow-sm">
                                            <h3 className="font-bold text-sm text-[#0b1c30] border-b border-gray-100 pb-2">Data Pemilik / Mitra</h3>
                                            
                                            <div className="flex flex-col gap-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center text-[#ff7a00] shrink-0">
                                                        <User className="w-4 h-4 shrink-0" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-gray-800">
                                                            {mitraProfile?.full_name || mitraProfile?.name || isEditingKostManager?.user?.name || isEditingKostManager?.user?.full_name || isEditingKostManager?.transaction?.metadata?.ownerName || isEditingKostManager?.transaction?.metadata?.userName || 'Pemilik / Mitra Kost'}
                                                        </span>
                                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Pemilik / Mitra</span>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center gap-3 text-xs text-gray-600">
                                                    <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                    <span className="font-semibold">
                                                        {mitraProfile?.phone || isEditingKostManager?.user?.phone || isEditingKostManager?.owner_phone || isEditingKostManager?.transaction?.metadata?.ownerPhone || isEditingKostManager?.transaction?.metadata?.phone || '-'}
                                                    </span>
                                                </div>
                                                
                                                <div className="flex items-center gap-3 text-xs text-gray-600">
                                                    <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                    <span className="font-semibold">
                                                        {mitraProfile?.email || isEditingKostManager?.user?.email || isEditingKostManager?.transaction?.metadata?.ownerEmail || isEditingKostManager?.transaction?.metadata?.userEmail || '-'}
                                                    </span>
                                                </div>
                                            </div>
                                        </section>

                                        {/* Data Properti & Lokasi Administratif */}
                                        <section className="bg-white border border-[#e0c0af] rounded-2xl p-5 flex flex-col gap-4 shadow-sm">
                                            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                                                <h3 className="font-bold text-sm text-[#0b1c30]">Data Properti &amp; Lokasi Administratif</h3>
                                                <button 
                                                    type="button" 
                                                    onClick={() => setKmStep(1)} 
                                                    className="text-xs text-[#ff7a00] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                                                >
                                                    <Edit className="w-3.5 h-3.5" /> Edit Wilayah
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                <div className="bg-orange-50/40 border border-orange-100 rounded-xl p-3 flex flex-col gap-1">
                                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Provinsi</span>
                                                    <span className="text-xs font-black text-gray-800 flex items-center gap-1.5">
                                                        <Building2 className="w-3.5 h-3.5 text-[#ff7a00] shrink-0" />
                                                        {kmListingForm.province || 'Sulawesi Selatan'}
                                                    </span>
                                                </div>
                                                <div className="bg-orange-50/40 border border-orange-100 rounded-xl p-3 flex flex-col gap-1">
                                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Kota / Kabupaten</span>
                                                    <span className="text-xs font-black text-gray-800 flex items-center gap-1.5">
                                                        <MapPin className="w-3.5 h-3.5 text-[#ff7a00] shrink-0" />
                                                        {kmListingForm.city || 'Makassar'}
                                                    </span>
                                                </div>
                                                <div className="bg-orange-50/40 border border-orange-100 rounded-xl p-3 flex flex-col gap-1">
                                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Kecamatan / Area</span>
                                                    <span className="text-xs font-black text-gray-800 flex items-center gap-1.5">
                                                        <Navigation className="w-3.5 h-3.5 text-[#ff7a00] shrink-0" />
                                                        {kmListingForm.area || '-'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="bg-gray-50 border border-gray-200/80 rounded-xl p-3.5 flex flex-col gap-1.5">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                                        <MapPin className="w-3 h-3 text-[#ff7a00]" /> Alamat Lengkap &amp; Titik GPS
                                                    </span>
                                                    {kmListingForm.location && (
                                                        <span className="text-[10px] font-mono font-bold text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200">
                                                            GPS: {typeof kmListingForm.location.lat === 'number' ? kmListingForm.location.lat.toFixed(6) : kmListingForm.location.lat}, {typeof kmListingForm.location.lng === 'number' ? kmListingForm.location.lng.toFixed(6) : kmListingForm.location.lng}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs font-semibold text-gray-800 leading-relaxed">
                                                    {kmListingForm.address || 'Alamat lokasi lengkap kost belum diatur'}
                                                </p>
                                            </div>
                                        </section>

                                        {/* Simulasi Tampilan Mobile App (Preview Listing) */}
                                        {(() => {
                                            const lowestPrice = kmListingForm.roomTypes?.length > 0 
                                                ? Math.min(...kmListingForm.roomTypes.map((rt: any) => Number(rt.price)).filter((p: number) => p > 0))
                                                : 0;
                                            return (
                                                <section className="bg-white border border-[#e0c0af] rounded-2xl p-5 flex flex-col gap-4 shadow-sm">
                                                    <div className="flex flex-col gap-1">
                                                        <h3 className="font-bold text-sm text-[#0b1c30]">Simulasi Tampilan Aplikasi (Preview Mobile)</h3>
                                                        <p className="text-[10px] text-gray-500 leading-normal">
                                                            Berikut adalah simulasi bagaimana properti kost ini akan tampil di layar handphone calon penyewa setelah disetujui dan aktif.
                                                        </p>
                                                    </div>

                                                    {/* Physical-like Phone Frame Container */}
                                                    <div className="mx-auto w-full max-w-[340px] bg-slate-900 rounded-[36px] p-2.5 shadow-xl border-4 border-slate-800 relative overflow-hidden">
                                                        {/* Top Speaker Earphone Grill */}
                                                        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-1 bg-slate-800 rounded-full z-20"></div>
                                                        
                                                        {/* Screen Container */}
                                                        <div 
                                                            className="bg-white rounded-[26px] overflow-hidden flex flex-col relative select-none text-[#0b1c30] text-xs font-sans"
                                                            style={{ aspectRatio: '9/19' }}
                                                        >
                                                            
                                                            {/* Simulated iOS/Android Status Bar */}
                                                            <div className="bg-white px-5 pt-2.5 pb-1 flex items-center justify-between text-[10px] font-bold text-gray-800 shrink-0">
                                                                <span>09:41</span>
                                                                {/* Modern Pill Notch */}
                                                                <div className="w-16 h-4 bg-black rounded-full shrink-0"></div>
                                                                <div className="flex items-center gap-1">
                                                                    <Signal className="w-3 h-3 text-gray-800 shrink-0" />
                                                                    <Wifi className="w-3 h-3 text-gray-800 shrink-0" />
                                                                    <BatteryCharging className="w-3.5 h-3.5 text-gray-800 shrink-0" />
                                                                </div>
                                                            </div>

                                                            {/* Simulated App Bar */}
                                                            <div className="bg-white px-3 py-2 flex items-center justify-between border-b border-gray-100 shrink-0">
                                                                <button type="button" className="w-7 h-7 rounded-full bg-gray-50 flex items-center justify-center text-gray-600 hover:bg-gray-100">
                                                                    <ArrowLeft className="w-4 h-4 shrink-0 font-black" />
                                                                </button>
                                                                <span className="font-extrabold text-[10px] uppercase tracking-wider text-gray-500">Detail Kost</span>
                                                                <div className="flex gap-1.5">
                                                                    <button type="button" className="w-7 h-7 rounded-full bg-gray-50 flex items-center justify-center text-gray-600">
                                                                        <Share2 className="w-4 h-4 shrink-0" />
                                                                    </button>
                                                                    <button type="button" className="w-7 h-7 rounded-full bg-gray-50 flex items-center justify-center text-red-500">
                                                                        <Heart className="w-4 h-4 shrink-0" />
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            {/* Scrollable Screen Content */}
                                                            <div className="flex-grow overflow-y-auto hide-scrollbar flex flex-col">
                                                                {/* Hero Photo Carousel */}
                                                                {kmListingForm.image_urls && kmListingForm.image_urls.length > 0 ? (
                                                                    <div className="relative aspect-[16/10] w-full shrink-0 bg-gray-100">
                                                                        <img 
                                                                            src={getImageUrlString(kmListingForm.image_urls[activePhotoIdx])} 
                                                                            alt="Property Preview" 
                                                                            className="w-full h-full object-cover"
                                                                        />
                                                                        <div className="absolute bottom-2.5 right-2.5 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-full text-white text-[8px] font-bold tracking-wider">
                                                                            {activePhotoIdx + 1}/{kmListingForm.image_urls.length} FOTO
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div className="aspect-[16/10] w-full shrink-0 bg-gray-50 border-b border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 gap-1">
                                                                        <Camera className="w-6 h-6 text-gray-400 shrink-0" />
                                                                        <span className="text-[8px] font-bold uppercase tracking-wider">Belum ada foto</span>
                                                                    </div>
                                                                )}

                                                                {/* Mini Thumbnail strip */}
                                                                {kmListingForm.image_urls && kmListingForm.image_urls.length > 1 && (
                                                                    <div className="px-3 pt-2 pb-1.5 flex gap-1.5 overflow-x-auto shrink-0 bg-white hide-scrollbar border-b border-gray-50">
                                                                        {kmListingForm.image_urls.map((img: any, idx: number) => (
                                                                            <button 
                                                                                key={idx}
                                                                                type="button"
                                                                                onClick={() => setActivePhotoIdx(idx)}
                                                                                className={`w-9 h-9 rounded-md overflow-hidden border shrink-0 transition-all ${activePhotoIdx === idx ? 'border-[#ff7a00] ring-1 ring-[#ff7a00]' : 'border-transparent opacity-65'}`}
                                                                            >
                                                                                <img src={getImageUrlString(img)} className="w-full h-full object-cover" />
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                )}

                                                                {/* Content Body */}
                                                                <div className="p-3.5 flex flex-col gap-3 bg-white">
                                                                    {/* Type & Verified Badge Row */}
                                                                    <div className="flex flex-wrap items-center gap-1.5">
                                                                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest text-white ${
                                                                            kmListingForm.type === 'Putra' 
                                                                                ? 'bg-blue-500' 
                                                                                : kmListingForm.type === 'Putri' 
                                                                                    ? 'bg-pink-500' 
                                                                                    : 'bg-purple-500'
                                                                        }`}>
                                                                            {kmListingForm.type || 'Campur'}
                                                                        </span>
                                                                        <span className="bg-orange-500 text-white px-2 py-0.5 rounded-full text-[8px] font-black flex items-center gap-1 border border-orange-400 uppercase tracking-widest shadow-sm">
                                                                            Terverifikasi
                                                                        </span>
                                                                        {kmListingForm.campuses && (
                                                                            <span className="px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider bg-gray-50 border border-gray-150 text-gray-500">
                                                                                Dekat {typeof kmListingForm.campuses === 'object' && kmListingForm.campuses !== null ? (kmListingForm.campuses.name || kmListingForm.campuses.title || '') : kmListingForm.campuses}
                                                                            </span>
                                                                        )}
                                                                    </div>

                                                                    {/* Title */}
                                                                    <h2 className="text-[17px] font-black text-gray-900 uppercase tracking-tighter leading-none mt-1 capitalize">{kmListingForm.title || 'Nama Kost Madani'}</h2>

                                                                    {/* Price Display */}
                                                                    <div className="flex flex-col gap-0.5 mt-0.5">
                                                                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">Harga Mulai Dari</span>
                                                                        <div className="flex items-baseline gap-1">
                                                                            <span className="text-[16px] font-extrabold text-[#ff7a00]">Rp {formatThousand(lowestPrice || 0)}</span>
                                                                            <span className="text-[9px] text-gray-500 font-medium">/ bulan</span>
                                                                        </div>
                                                                    </div>

                                                                    {/* Address / Location Pin & Regional Badges */}
                                                                    <div className="flex flex-col gap-1.5 pb-3 border-b border-gray-100 mt-1">
                                                                        <div className="flex items-start text-gray-500 font-medium text-[10px]">
                                                                            <MapPin className="w-3.5 h-3.5 text-[#ff7a00] shrink-0 mr-1 mt-0.5" />
                                                                            <span className="leading-normal">{kmListingForm.address || 'Alamat lokasi lengkap kost...'}</span>
                                                                        </div>
                                                                        <div className="flex flex-wrap items-center gap-1 pl-4">
                                                                            {kmListingForm.area && (
                                                                                <span className="bg-orange-50 text-orange-900 px-2 py-0.5 rounded text-[8px] font-bold border border-orange-200/80">
                                                                                    Kec. {kmListingForm.area}
                                                                                </span>
                                                                            )}
                                                                            {kmListingForm.city && (
                                                                                <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[8px] font-bold border border-gray-200">
                                                                                    {kmListingForm.city}
                                                                                </span>
                                                                            )}
                                                                            <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[8px] font-bold border border-gray-200">
                                                                                {kmListingForm.province || 'Sulawesi Selatan'}
                                                                            </span>
                                                                        </div>
                                                                    </div>

                                                                    {/* Fasilitas Properti Utama */}
                                                                    <div className="flex flex-col gap-1.5 py-1">
                                                                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Fasilitas Properti</span>
                                                                        <div className="flex flex-wrap gap-1.5">
                                                                            {kmListingForm.facilities && kmListingForm.facilities.length > 0 ? (
                                                                                kmListingForm.facilities.map((fac: string) => (
                                                                                    <span key={fac} className="bg-gray-50 text-gray-600 px-3 py-1.5 rounded-xl text-[9px] font-bold border border-gray-100 flex items-center gap-1">
                                                                                        <span className="w-1 h-1 rounded-full bg-orange-500"></span>
                                                                                        {fac}
                                                                                    </span>
                                                                                ))
                                                                            ) : (
                                                                                <span className="text-gray-400 italic text-[9px]">Tidak ada fasilitas khusus</span>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    {/* Short Description */}
                                                                    <div className="flex flex-col gap-1 pt-1.5 border-t border-gray-100">
                                                                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Deskripsi Kost</span>
                                                                        <p className="text-gray-600 leading-relaxed whitespace-pre-line text-[10px] font-medium">
                                                                            {kmListingForm.description || 'Kost nyaman dan aman, berlokasi strategis dekat dengan area kampus/kantor. Fasilitas lengkap dan siap dihuni...'}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Floating Booking Action Bar */}
                                                            <div className="bg-white border-t border-gray-100 p-2.5 flex items-center justify-between gap-2.5 shrink-0">
                                                                <button type="button" className="w-[38px] h-[38px] rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 hover:bg-emerald-100 transition-colors">
                                                                    <MessageCircle className="w-4 h-4 shrink-0" />
                                                                </button>
                                                                <button 
                                                                    type="button" 
                                                                    className="flex-grow h-[38px] bg-[#ff7a00] hover:bg-orange-600 text-white rounded-xl font-extrabold uppercase text-[10px] tracking-wider flex items-center justify-center transition-all shadow-md shadow-orange-100"
                                                                >
                                                                    Ajukan Sewa
                                                                </button>
                                                            </div>

                                                        </div>
                                                    </div>
                                                </section>
                                            );
                                        })()}

                                        {/* Data Kamar */}
                                        <section className="bg-white border border-[#e0c0af] rounded-2xl p-5 flex flex-col gap-4 shadow-sm">
                                            <h3 className="font-bold text-sm text-[#0b1c30] border-b border-gray-100 pb-2">Data Kamar</h3>
                                            
                                            {/* Summary Stats Cards */}
                                            <div className="grid grid-cols-3 gap-3 text-center">
                                                <div className="bg-gray-50 border border-gray-150 rounded-xl p-2 flex flex-col">
                                                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Total</span>
                                                    <span className="text-sm font-extrabold text-[#0b1c30] mt-0.5">
                                                        {kmListingForm.roomTypes?.length || 0}
                                                    </span>
                                                </div>
                                                <div className="bg-gray-50 border border-gray-150 rounded-xl p-2 flex flex-col">
                                                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Terisi</span>
                                                    <span className="text-sm font-extrabold text-[#0b1c30] mt-0.5">
                                                        {kmListingForm.roomTypes?.filter((r: any) => r.status === 'Terisi').length || 0}
                                                    </span>
                                                </div>
                                                <div className="bg-gray-50 border border-gray-150 rounded-xl p-2 flex flex-col">
                                                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Kosong</span>
                                                    <span className="text-sm font-extrabold text-[#0b1c30] mt-0.5">
                                                        {kmListingForm.roomTypes?.filter((r: any) => r.status !== 'Terisi').length || 0}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-2 mt-2">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Daftar Kamar</span>
                                                <div className="space-y-2">
                                                    {kmListingForm.roomTypes?.map((rt: any, idx: number) => {
                                                        const isExpanded = expandedRoomIdx === idx;
                                                        const isTerisi = rt.status === 'Terisi';
                                                        return (
                                                            <div key={idx} className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                                                                {/* Accordion Trigger */}
                                                                <button 
                                                                    type="button"
                                                                    onClick={() => setExpandedRoomIdx(isExpanded ? null : idx)}
                                                                    className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50/50 transition-colors"
                                                                >
                                                                    <div className="flex items-center gap-2.5">
                                                                        <span className="text-xs font-bold text-gray-800">{rt.name || `Kamar ${idx + 1}`}</span>
                                                                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${isTerisi ? 'bg-orange-50 text-[#ff7a00] border-orange-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                                                                            {isTerisi ? 'Terisi' : 'Kosong'}
                                                                        </span>
                                                                    </div>
                                                                    <ChevronDown className="w-4 h-4 text-gray-400 transition-transform duration-200 shrink-0" style={{ transform: isExpanded ? 'rotate(180deg)' : 'none' }} />
                                                                </button>
                                                                
                                                                {/* Accordion Content */}
                                                                {isExpanded && (
                                                                    <div className="px-4 pb-4 pt-3 border-t border-gray-100 bg-gray-50/30 flex flex-col gap-3.5 text-xs text-gray-700">
                                                                        
                                                                        {/* Section 1: Detail & Status */}
                                                                        <div className="grid grid-cols-3 gap-2.5 pb-2.5 border-b border-gray-100/60">
                                                                            <div className="flex flex-col gap-0.5">
                                                                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Tipe Kamar</span>
                                                                                <span className="font-bold text-gray-800">{rt.type || 'Standard'}</span>
                                                                            </div>
                                                                            <div className="flex flex-col gap-0.5">
                                                                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Lantai</span>
                                                                                <span className="font-bold text-gray-800">{rt.floor || 'Lantai 1'}</span>
                                                                            </div>
                                                                            <div className="flex flex-col gap-0.5">
                                                                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Kapasitas</span>
                                                                                <span className="font-bold text-gray-800">{rt.maxOccupants || 1} Orang</span>
                                                                            </div>
                                                                        </div>

                                                                        {/* Section 2: Info Penghuni jika Terisi */}
                                                                        {isTerisi && (
                                                                            <div className="flex flex-col gap-2 pb-2.5 border-b border-gray-100/60 bg-[#fffbfa] p-2.5 rounded-xl border border-orange-100/80 shadow-2xs">
                                                                                <div className="flex items-center justify-between gap-2">
                                                                                    <div className="flex items-center gap-1.5 min-w-0">
                                                                                        <User className="w-3.5 h-3.5 text-[#ff7a00] shrink-0" />
                                                                                        <div className="flex flex-col min-w-0">
                                                                                            <span className="text-[8px] font-bold text-[#ff7a00] uppercase tracking-wider leading-none">Penghuni</span>
                                                                                            <span className="font-extrabold text-gray-800 text-xs truncate">{rt.residentName || '-'}</span>
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="shrink-0 flex items-center gap-1 bg-orange-100/70 border border-orange-200/60 px-2 py-0.5 rounded-full">
                                                                                        <span className="text-[8px] font-bold text-orange-600 uppercase tracking-wider">Sewa:</span>
                                                                                        <span className="text-[9px] font-extrabold text-[#ff7a00] uppercase">{rt.paymentPeriod || 'Bulanan'}</span>
                                                                                    </div>
                                                                                </div>

                                                                                <div className="flex items-center gap-1.5 pt-1.5 border-t border-orange-100/60">
                                                                                    <Phone className="w-3.5 h-3.5 text-[#ff7a00] shrink-0" />
                                                                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                                                                        <span className="text-[8px] font-bold text-[#ff7a00] uppercase tracking-wider shrink-0">Nomor WA:</span>
                                                                                        <span className="font-bold text-gray-800 text-xs tracking-tight truncate select-all">{rt.residentPhone || '-'}</span>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        )}

                                                                        {/* Section 3: Skema Harga */}
                                                                        <div className="flex flex-col gap-1 pb-2.5 border-b border-gray-100/60">
                                                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Skema Harga</span>
                                                                            <div className="flex flex-wrap gap-1.5">
                                                                                {rt.pricing && rt.pricing.length > 0 ? (
                                                                                    rt.pricing.map((p: any, pIdx: number) => (
                                                                                        <span key={pIdx} className="bg-white border border-gray-200 px-2.5 py-1 rounded-md text-[10px] font-bold text-gray-700">
                                                                                            <span className="text-gray-400 capitalize">{p.period}:</span> Rp {formatThousand(p.price || 0)}
                                                                                        </span>
                                                                                    ))
                                                                                ) : (
                                                                                    <span className="bg-white border border-gray-200 px-2.5 py-1 rounded-md text-[10px] font-bold text-[#ff7a00]">
                                                                                        Rp {formatThousand(rt.price || 0)} <span className="text-gray-400 text-[9px] font-normal">/ Bulanan</span>
                                                                                    </span>
                                                                                )}
                                                                                {rt.extraOccupantFee && rt.extraOccupantFee > 0 ? (
                                                                                    <span className="bg-orange-50 border border-orange-100 px-2.5 py-1 rounded-md text-[10px] font-bold text-[#ff7a00]">
                                                                                        <span className="text-orange-400">Ekstra Orang:</span> +Rp {formatThousand(rt.extraOccupantFee)}
                                                                                    </span>
                                                                                ) : null}
                                                                            </div>
                                                                        </div>

                                                                        {/* Section 4: Biaya Bulanan Lainnya */}
                                                                        {rt.otherFeeAmount && rt.otherFeeAmount > 0 ? (
                                                                            <div className="flex flex-col gap-1 pb-2.5 border-b border-gray-100/60">
                                                                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Biaya Bulanan Lainnya</span>
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className="bg-white border border-gray-200 px-2.5 py-1 rounded-md text-[10px] font-bold text-gray-700">
                                                                                        Rp {formatThousand(rt.otherFeeAmount)} <span className="text-gray-400 text-[9px] font-normal">/ Bulan</span>
                                                                                    </span>
                                                                                    <div className="flex flex-wrap gap-1">
                                                                                        {rt.otherFeeCoveredItems?.map((item: string) => (
                                                                                            <span key={item} className="bg-gray-150 text-gray-600 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider">{item}</span>
                                                                                        ))}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        ) : null}

                                                                        {/* Section 5: Fasilitas */}
                                                                        <div className="flex flex-col gap-1.5 pb-2.5 border-b border-gray-100/60">
                                                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Fasilitas Kamar</span>
                                                                            <div className="flex flex-wrap gap-1">
                                                                                {rt.roomFacilities && rt.roomFacilities.length > 0 ? (
                                                                                    rt.roomFacilities.map((fac: string) => (
                                                                                        <span key={fac} className="bg-white border border-gray-200 px-2 py-0.5 rounded text-[9px] font-bold text-gray-700 uppercase tracking-wide">
                                                                                            {fac}
                                                                                        </span>
                                                                                    ))
                                                                                ) : (
                                                                                    <span className="text-gray-450 italic text-[10px]">Tidak ada fasilitas khusus</span>
                                                                                )}
                                                                            </div>

                                                                            {/* Fasilitas Kamar Mandi */}
                                                                            {rt.bathroomFacilities && rt.bathroomFacilities.length > 0 && (
                                                                                <div className="mt-1 pl-2.5 border-l-2 border-orange-400 flex flex-col gap-1">
                                                                                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">Kelengkapan KM Dalam:</span>
                                                                                    <div className="flex flex-wrap gap-1">
                                                                                        {rt.bathroomFacilities.map((bf: string) => (
                                                                                            <span key={bf} className="bg-orange-50 text-[#ff7a00] px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wide border border-orange-100">{bf}</span>
                                                                                        ))}
                                                                                    </div>
                                                                                </div>
                                                                            )}

                                                                            {/* Fasilitas Dapur */}
                                                                            {rt.kitchenFacilities && rt.kitchenFacilities.length > 0 && (
                                                                                <div className="mt-1 pl-2.5 border-l-2 border-orange-400 flex flex-col gap-1">
                                                                                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">Kelengkapan Dapur Dalam:</span>
                                                                                    <div className="flex flex-wrap gap-1">
                                                                                        {rt.kitchenFacilities.map((kf: string) => (
                                                                                            <span key={kf} className="bg-orange-50 text-[#ff7a00] px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wide border border-orange-100">{kf}</span>
                                                                                        ))}
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </div>

                                                                        {/* Section 6: Dokumentasi Foto */}
                                                                        {rt.images && rt.images.filter(Boolean).length > 0 && (
                                                                            <div className="flex flex-col gap-1.5">
                                                                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Foto Kondisi Kamar</span>
                                                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                                                                    {rt.images.map((img: string, imgIdx: number) => {
                                                                                        if (!img) return null;
                                                                                        const label = rt.photoCategories?.[imgIdx] || 'Foto Kamar';
                                                                                        return (
                                                                                            <div key={imgIdx} className="aspect-video rounded-lg overflow-hidden border border-gray-200 relative group">
                                                                                                <img src={img} className="w-full h-full object-cover" />
                                                                                                <div className="absolute bottom-0 left-0 right-0 bg-black/60 py-0.5 px-2 text-[7px] text-white text-center uppercase font-bold tracking-wider">{label}</div>
                                                                                            </div>
                                                                                        );
                                                                                    })}
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </section>

                                        {/* Syarat & Ketentuan */}
                                        <section className={`rounded-2xl p-5 flex flex-col gap-4 shadow-sm relative transition-all ${
                                            currentEvalData.hasRevision && currentEvalData.partner
                                                ? 'border-2 border-amber-400 ring-4 ring-amber-400/30 shadow-[0_0_25px_rgba(245,158,11,0.25)] bg-gradient-to-br from-amber-500/[0.04] via-white to-orange-500/[0.02] animate-pulse'
                                                : 'bg-white border border-[#e0c0af]'
                                        }`}>
                                            {currentEvalData.hasRevision && currentEvalData.partner && (
                                                <div className="absolute -top-3 right-4 z-10 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-[10px] uppercase tracking-wider shadow-md shadow-amber-500/30 animate-bounce">
                                                    <Sparkles size={12} />
                                                    <span>⚠️ Perlu Revisi: Kerjasama Mitra</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                                                <h3 className="font-bold text-sm text-[#0b1c30]">Syarat &amp; Ketentuan Kerjasama Mitra</h3>
                                            </div>
                                            
                                            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 max-h-[140px] overflow-y-auto text-[10px] text-gray-650 leading-relaxed font-semibold">
                                                <p className="font-black text-gray-800 mb-1 text-[11px]">Syarat &amp; Ketentuan Penggunaan KostManager</p>
                                                <p className="mb-2">Dengan mendaftarkan properti Anda di KostManager, Anda menyetujui persyaratan berikut:</p>
                                                <p className="mb-1">1. <b>Mekanisme Listing:</b> Properti yang didaftarkan akan diverifikasi oleh tim internal sebelum status dinyatakan aktif secara penuh.</p>
                                                <p className="mb-1">2. <b>Akurasi Data:</b> Mitra bertanggung jawab sepenuhnya atas kebenaran seluruh informasi properti, fasilitas, dan kamar yang didata oleh agen survey.</p>
                                                <p className="mb-1">3. <b>Persetujuan Layanan:</b> Mitra sepakat untuk tunduk pada regulasi manajemen penagihan sewa dan pengelolaan penghuni sesuai sistem KostManager.</p>
                                            </div>
                                            
                                            <label className="flex items-start gap-2.5 cursor-pointer mt-1">
                                                <input 
                                                    type="checkbox"
                                                    checked={agreedToTerms}
                                                    onChange={e => setAgreedToTerms(e.target.checked)}
                                                    className="rounded border-[#e0c0af] text-[#ff7a00] focus:ring-[#ff7a00] w-4.5 h-4.5 mt-0.5 shrink-0"
                                                />
                                                <span className="text-[10px] text-gray-600 font-bold leading-relaxed">
                                                    Saya menyetujui syarat dan ketentuan yang berlaku di atas serta menyatakan bahwa data yang diisi adalah benar.
                                                </span>
                                            </label>
                                        </section>

                                        {/* Tanda Tangan Digital Pemilik */}
                                        <section className={`rounded-2xl p-5 flex flex-col gap-4 shadow-sm relative transition-all ${
                                            currentEvalData.hasRevision && currentEvalData.partner
                                                ? 'border-2 border-amber-400 ring-4 ring-amber-400/30 shadow-[0_0_25px_rgba(245,158,11,0.25)] bg-gradient-to-br from-amber-500/[0.04] via-white to-orange-500/[0.02] animate-pulse'
                                                : 'bg-white border border-[#e0c0af]'
                                        }`}>
                                            {currentEvalData.hasRevision && currentEvalData.partner && (
                                                <div className="absolute -top-3 right-4 z-10 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-[10px] uppercase tracking-wider shadow-md shadow-amber-500/30 animate-bounce">
                                                    <Sparkles size={12} />
                                                    <span>⚠️ Perlu Revisi: Tanda Tangan Digital</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-bold text-sm text-[#0b1c30]">Tanda Tangan Digital Pemilik</h3>
                                                    {signatureData && (
                                                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                                                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Tersimpan
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {signatureData ? (
                                                        <button 
                                                            type="button" 
                                                            onClick={() => {
                                                                setSignatureData(null);
                                                                if (canvasRef.current) {
                                                                    const ctx = canvasRef.current.getContext('2d');
                                                                    ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                                                                }
                                                            }}
                                                            className="text-xs text-[#ff7a00] font-bold hover:underline"
                                                        >
                                                            ✏️ Tanda Tangan Ulang
                                                        </button>
                                                    ) : (
                                                        <button 
                                                            type="button" 
                                                            onClick={clearSignature}
                                                            className="text-xs text-red-500 font-bold hover:underline"
                                                        >
                                                            Reset
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            {signatureData ? (
                                                <div className="flex flex-col items-center justify-center p-4 bg-emerald-50/40 rounded-xl border border-emerald-200/80 space-y-2">
                                                    <img 
                                                        src={signatureData} 
                                                        alt="Tanda Tangan Digital Tersimpan" 
                                                        className="max-h-28 object-contain bg-white rounded-lg p-2 border border-gray-200 shadow-2xs" 
                                                    />
                                                    <p className="text-[10px] text-emerald-800 font-bold text-center">
                                                        ✓ Tanda tangan digital pemilik kos telah tersimpan sah dari survei sebelumnya. Tidak perlu tanda tangan ulang.
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="relative border-2 border-dashed border-[#e0c0af] rounded-xl bg-gray-50/50 aspect-[5/2] w-full overflow-hidden flex flex-col items-center justify-center">
                                                    <canvas 
                                                        ref={canvasRef}
                                                        width={500}
                                                        height={200}
                                                        className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
                                                        onMouseDown={startDrawing}
                                                        onMouseMove={draw}
                                                        onMouseUp={stopDrawing}
                                                        onMouseLeave={stopDrawing}
                                                        onTouchStart={startDrawing}
                                                        onTouchMove={draw}
                                                        onTouchEnd={stopDrawing}
                                                    />
                                                    <div className="pointer-events-none flex flex-col items-center gap-1.5 text-gray-400">
                                                        <Edit3 className="w-6 h-6 shrink-0" />
                                                        <span className="text-[9px] font-bold uppercase tracking-wider">Tanda tangan di area ini</span>
                                                    </div>
                                                </div>
                                            )}
                                            <p className="text-[10px] text-gray-500 text-center leading-relaxed font-semibold">
                                                Sebagai persetujuan akhir penambahan properti Kos pada layanan KostManager.
                                            </p>
                                        </section>
                                    </div>
                                )})()}
                            </div>

                            {/* Fixed Bottom Navigation Buttons */}
                            <div className="bg-white border-t border-[#e0c0af] py-3.5 px-6 shrink-0 flex items-center justify-between gap-3 shadow-[0_-10px_30px_rgba(0,0,0,0.03)]">
                                {kmStep === 1 && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={closeKostManagerListingWithSave}
                                            className="flex-1 h-[48px] border border-[#ff7a00] text-[#ff7a00] rounded-full font-bold text-xs uppercase tracking-wider hover:bg-orange-50 transition-colors"
                                        >
                                            Keluar
                                        </button>
                                        <button
                                            type="button"
                                             onClick={async () => {
                                                 if (!kmListingForm.totalRooms || kmListingForm.totalRooms < 1) {
                                                     alert('Silakan masukkan total jumlah kamar terlebih dahulu.');
                                                     return;
                                                 }
                                                 setKmStep(2);
                                                 await handleSaveDraftDirectly(kmListingForm, true);
                                             }}
                                            className="flex-[2] h-[48px] bg-[#ff7a00] hover:bg-orange-600 text-white rounded-full font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg active:scale-95 transition-all"
                                        >
                                            Lanjut ke Step 2
                                        </button>
                                    </>
                                )}

                                {kmStep === 2 && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                setKmStep(1);
                                                await handleSaveDraftDirectly(kmListingForm, true);
                                            }}
                                            className="flex-1 h-[48px] border border-gray-300 text-gray-600 rounded-full font-bold text-xs uppercase tracking-wider hover:bg-gray-50 transition-colors"
                                        >
                                            Kembali ke Step 1
                                        </button>
                                         <button
                                             type="button"
                                             disabled={(kmListingForm.roomTypes?.length || 0) !== (kmListingForm.totalRooms || 0)}
                                             onClick={async () => {
                                                 setKmStep(3);
                                                 await handleSaveDraftDirectly(kmListingForm, true);
                                             }}
                                             className={`flex-[2] h-[48px] rounded-full font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 ${(kmListingForm.roomTypes?.length || 0) === (kmListingForm.totalRooms || 0) ? 'bg-[#ff7a00] hover:bg-orange-600 text-white hover:shadow-lg' : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'}`}
                                         >
                                             {(kmListingForm.roomTypes?.length || 0) !== (kmListingForm.totalRooms || 0) ? 'Kamar Belum Lengkap' : 'Lanjut ke Step 3'}
                                         </button>
                                    </>
                                )}

                                {kmStep === 3 && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => setKmStep(2)}
                                            className="flex-1 h-[48px] border border-[#ff7a00] text-[#ff7a00] rounded-full font-bold text-xs uppercase tracking-wider hover:bg-orange-50/50 transition-colors active:scale-95"
                                        >
                                            Kembali ke Step 2
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleSaveKostManagerListing}
                                            disabled={isSubmitting || !agreedToTerms || !signatureData}
                                            className={`flex-[2] h-[48px] rounded-full font-bold text-xs uppercase tracking-wider shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5 ${(agreedToTerms && signatureData) ? (isEditingKostManager?.status === 'SUBMITTED' ? 'bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-lg' : 'bg-[#ff7a00] hover:bg-orange-600 text-white hover:shadow-lg') : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'}`}
                                        >
                                            <UploadCloud className="w-4 h-4 shrink-0" />
                                            {isSubmitting ? 'Mengirim...' : ((isEditingKostManager?.status === 'REVISION_REQUIRED' || isEditingKostManager?.notes?.includes('[REVISI')) ? '🔄 Kirim Ulang Hasil Revisi ke Admin' : isEditingKostManager?.status === 'SUBMITTED' ? '🔄 Perbarui & Kirim Ulang ke Admin' : 'Selesaikan & Submit')}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}

            </div>

            {/* Hidden Inputs for Camera and Gallery */}
            <input 
                ref={cameraInputRef}
                type="file" 
                accept="image/*" 
                capture="environment" 
                className="hidden" 
                onChange={(e) => {
                    if (uploadSourceFieldId) {
                        handleSurveyPhotoUpload(uploadSourceFieldId, e.target.files);
                        setUploadSourceFieldId(null);
                    }
                }} 
            />
            <input 
                ref={galleryInputRef}
                type="file" 
                accept="image/*" 
                multiple
                className="hidden" 
                onChange={(e) => {
                    if (uploadSourceFieldId) {
                        handleSurveyPhotoUpload(uploadSourceFieldId, e.target.files);
                        setUploadSourceFieldId(null);
                    }
                }} 
            />

            {/* ── MODAL RESCHEDULE SURVEY (AGENT) ────────────────────────── */}
            {isReschedulingSurvey && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm" onClick={() => setIsReschedulingSurvey(null)}></div>
                    <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl relative z-10 flex flex-col overflow-hidden animate-in zoom-in-95">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h2 className="text-lg font-black uppercase text-gray-900">Jadwal Ulang Survey</h2>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Kost: {isReschedulingSurvey.kost_name}</p>
                            </div>
                            <button onClick={() => setIsReschedulingSurvey(null)} className="w-8 h-8 flex items-center justify-center border rounded-full hover:bg-white transition-colors">&times;</button>
                        </div>
                        <form onSubmit={(e) => { e.preventDefault(); handleRequestReschedule(); }} className="p-6 space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-gray-700 uppercase tracking-widest block mb-2">Tanggal Baru</label>
                                <input 
                                    type="date"
                                    required
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-bold text-gray-800 focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all"
                                    value={newSurveyDate}
                                    onChange={e => setNewSurveyDate(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-700 uppercase tracking-widest block mb-2">Waktu Baru</label>
                                <input 
                                    type="time"
                                    required
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-bold text-gray-800 focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all"
                                    value={newSurveyTime}
                                    onChange={e => setNewSurveyTime(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-700 uppercase tracking-widest block mb-2">Alasan Penjadwalan Ulang</label>
                                <textarea
                                    required
                                    rows={3}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-bold text-gray-800 focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all resize-none"
                                    placeholder="Tulis alasan reschedule agar pemesan dapat memahaminya..."
                                    value={rescheduleReason}
                                    onChange={e => setRescheduleReason(e.target.value)}
                                />
                            </div>
                            
                            <div className="flex gap-3 pt-4">
                                <button 
                                    type="button"
                                    onClick={() => setIsReschedulingSurvey(null)}
                                    className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                                >
                                    Batal
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={isSubmitting}
                                    className="flex-1 py-3.5 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-300 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                                >
                                    {isSubmitting ? 'Mengirim...' : 'Simpan Jadwal'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Native Source Selection Action Sheet */}
            {uploadSourceFieldId && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-end justify-center" onClick={() => setUploadSourceFieldId(null)}>
                    <div className="bg-white w-full max-w-md rounded-t-[2.5rem] p-6 space-y-5 animate-in slide-in-from-bottom duration-200 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-2"></div>
                        <h3 className="text-sm font-bold text-gray-800 text-center uppercase tracking-widest">Pilih Sumber Foto</h3>
                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <button
                                type="button"
                                onClick={() => {
                                    cameraInputRef.current?.click();
                                }}
                                className="flex flex-col items-center justify-center p-5 bg-orange-50 hover:bg-orange-100 border border-orange-100 rounded-3xl transition-all active:scale-95 shadow-sm"
                            >
                                <span className="text-3xl mb-2">📸</span>
                                <span className="text-xs font-black text-orange-600 tracking-wider">KAMERA HP</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    galleryInputRef.current?.click();
                                }}
                                className="flex flex-col items-center justify-center p-5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-3xl transition-all active:scale-95 shadow-sm"
                            >
                                <span className="text-3xl mb-2">🖼️</span>
                                <span className="text-xs font-black text-gray-700 tracking-wider">GALERI / FILE</span>
                            </button>
                        </div>
                        <button
                            type="button"
                            onClick={() => setUploadSourceFieldId(null)}
                            className="w-full py-4 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
                        >
                            Batal
                        </button>
                    </div>
                </div>
            )}

            {/* Modal Editor Sensor Foto Interaktif */}
            {sensorModalData && sensorModalData.isOpen && (
                <PhotoSensorModal
                    isOpen={sensorModalData.isOpen}
                    imageUrl={sensorModalData.imageUrl}
                    category={sensorModalData.category}
                    onClose={() => setSensorModalData(null)}
                    onApply={handleApplySensorModal}
                    uploadFn={(file, path) => uploadFileAndGetURL(file, path)}
                />
            )}
        </div>
    );

    return render;
};

export default AgentDashboard;
