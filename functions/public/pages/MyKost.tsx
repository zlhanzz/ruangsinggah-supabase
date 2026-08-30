import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../supabase';
import { ArrowLeft, Clock, MapPin, Receipt, Upload, Plus, MessageSquare, AlertCircle, FileText, X, Star, CheckCircle, CheckCircle2, Smartphone, Phone, Calendar, Search, Heart, ChevronRight, XCircle, Zap, Check, Activity, DoorClosed, ChevronDown, ChevronUp, Camera, ShieldCheck, Building, Bed, Bath, Wifi, Maximize2, Share2, PhoneCall, HelpCircle, Layers, Wrench, RotateCcw } from 'lucide-react';
import { Page } from '../types';
import { addPropertyReview, getExtraBills, settlePendingBills, cancelBookingRequest, expireBookingTransaction, BOOKING_EXPIRY_HOURS } from '../userService';
import PaymentGateway from '../components/PaymentGateway';
import ChatWindow from '../components/ChatWindow';
import { notifyAdminTransaction } from '../emailService';
import { FORMAT_CURRENCY } from '../constants';
import { getCurrentDate, setMockDate, getMockDateStr, parseDateSafely, calculateDaysRemaining } from '../utils/timeUtils';
import TimeSimulator from '../components/TimeSimulator';
import { getResidentStatus, syncResidentStatus, autoSyncAllSurveys } from '../adminService';
import DigitalReceiptModal, { ReceiptData } from '../components/DigitalReceiptModal';
import { sendRentReceiptWhatsApp } from '../rentBillingService';
import { getOrCreateChatSession, SYSTEM_ADMIN_ID } from '../chatService';


interface MyKostProps {
    user: any;
}

const FORMAT_DATE = (dateStr: any) => {
    if (!dateStr) return '-';

    // Try native parsing (works for ISO strings: YYYY-MM-DD or full ISO)
    let date = new Date(dateStr);

    // If native fails (Invalid Date), try matching Indonesian locale string format "D Month YYYY"
    // Examples: "20 April 2026", "5 Januari 2026"
    if (isNaN(date.getTime()) && typeof dateStr === 'string') {
        const months: Record<string, number> = {
            'januari': 0, 'februari': 1, 'maret': 2, 'april': 3, 'mei': 4, 'juni': 5,
            'juli': 6, 'agustus': 7, 'september': 8, 'oktober': 9, 'november': 10, 'desember': 11
        };

        const parts = dateStr.toLowerCase().split(' ');
        if (parts.length >= 3) {
            const day = parseInt(parts[0]);
            const month = months[parts[1]];
            const year = parseInt(parts[2]);

            if (!isNaN(day) && month !== undefined && !isNaN(year)) {
                date = new Date(year, month, day);
            }
        }
    }

    if (isNaN(date.getTime())) return dateStr; // Return as-is if all parsing fails

    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
};

const SkeletonLoader = () => (
    <div className="space-y-6 animate-pulse">
        {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm flex flex-col lg:flex-row gap-10">
                <div className="flex-1">
                    <div className="flex items-start gap-4 mb-6">
                        <div className="w-20 h-20 bg-gray-200 rounded-2xl shrink-0" />
                        <div className="flex-1 space-y-3">
                            <div className="h-6 bg-gray-200 rounded-md w-3/4" />
                            <div className="h-4 bg-gray-200 rounded-md w-1/2" />
                        </div>
                    </div>
                    <div className="h-20 bg-gray-100 rounded-xl" />
                </div>
                <div className="lg:w-72 space-y-3">
                    <div className="h-10 bg-gray-200 rounded-xl" />
                    <div className="h-10 bg-gray-200 rounded-xl" />
                </div>
            </div>
        ))}
    </div>
);
const StarRatingDisplay: React.FC<{ rating?: number }> = ({ rating }) => {
    if (!rating || rating === 0) return <span className="text-[10px] font-bold text-gray-400 italic">Belum dinilai</span>;
    
    return (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    className={`w-3.5 h-3.5 ${
                        star <= rating 
                        ? 'text-yellow-400 fill-yellow-400' 
                        : 'text-gray-200'
                    }`}
                />
            ))}
        </div>
    );
};

const MyKost: React.FC<MyKostProps> = ({ user }) => {
    const navigate = useNavigate();
    const { "*": tabParam } = useParams();
    const [activeKosts, setActiveKosts] = useState<any[]>([]);
    const [surveyRequests, setSurveyRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState<'diajukan' | 'aktif' | 'riwayat'>('diajukan');
    const [nowTick, setNowTick] = useState<number>(() => getCurrentDate().getTime());

    // Live 1-second interval for real-time scarcity countdown ticker
    useEffect(() => {
        const timer = setInterval(() => {
            setNowTick(getCurrentDate().getTime());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Helper: Hitung Batas Waktu & Sisa Waktu Pembayaran (1x24 Jam)
    const getBookingExpiryInfo = (kost: any) => {
        const s = (kost?.status || '').toUpperCase();
        if (s === 'EXPIRED') {
            return { isExpired: true, remainingMs: 0, hours: 0, minutes: 0, seconds: 0, isUrgent: true, deadlineDate: null };
        }
        if (s !== 'AWAITING_PAYMENT') {
            return { isExpired: false, remainingMs: 0, hours: 0, minutes: 0, seconds: 0, isUrgent: false, deadlineDate: null };
        }
        
        // Base time: approved_at > updated_at > created_at
        const kMeta = typeof kost.metadata === 'string' ? JSON.parse(kost.metadata) : (kost.metadata || {});
        const baseTimeStr = kost.updated_at || kost.approved_at || kMeta.approved_at || kost.created_at || kMeta.createdAt;
        const baseTime = baseTimeStr ? new Date(baseTimeStr).getTime() : 0;
        const deadline = baseTime + (BOOKING_EXPIRY_HOURS * 60 * 60 * 1000); // 24 jam
        const now = getCurrentDate().getTime();
        const remainingMs = deadline - now;
        const isExpired = baseTime > 0 && remainingMs <= 0;
        const safeMs = Math.max(0, remainingMs);
        const hours = Math.floor(safeMs / (1000 * 60 * 60));
        const minutes = Math.floor((safeMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((safeMs % (1000 * 60)) / 1000);
        const isUrgent = hours < 6; // Urgent when < 6 hours remaining

        return {
            isExpired,
            remainingMs: safeMs,
            hours,
            minutes,
            seconds,
            isUrgent,
            deadlineDate: baseTime > 0 ? new Date(deadline) : null
        };
    };

    // Auto-sync status EXPIRED to database if any booking has exceeded its payment window
    useEffect(() => {
        if (!activeKosts || activeKosts.length === 0) return;
        activeKosts.forEach(async (kost) => {
            const s = (kost.status || '').toUpperCase();
            if (s === 'AWAITING_PAYMENT') {
                const expiry = getBookingExpiryInfo(kost);
                if (expiry.isExpired && kost.id) {
                    try {
                        await expireBookingTransaction(kost.id, kost.resident_status_id);
                    } catch (err) {
                        console.error("Auto-expire failed:", err);
                    }
                }
            }
        });
    }, [nowTick, activeKosts]);


    // Sync state with URL
    useEffect(() => {
        if (tabParam) {
            const validTabs = ['diajukan', 'aktif', 'riwayat'];
            if (validTabs.includes(tabParam)) {
                setActiveTab(tabParam as any);
            } else {
                // Redirect invalid sub-paths to default
                navigate(`${Page.MY_BOOKINGS}/diajukan`, { replace: true });
            }
        } else {
            // Default to 'diajukan' if no sub-path, and update URL
            setActiveTab('diajukan');
            navigate(`${Page.MY_BOOKINGS}/diajukan`, { replace: true });
        }
    }, [tabParam, navigate]);

    const handleTabChange = (tab: 'diajukan' | 'aktif' | 'riwayat') => {
        navigate(`${Page.MY_BOOKINGS}/${tab}`);
    };
    const [extraBills, setExtraBills] = useState<any[]>([]);

    // Modal states
    const [showExtensionModal, setShowExtensionModal] = useState(false);
    const [showExtraBillModal, setShowExtraBillModal] = useState(false);
    const [showComplaintModal, setShowComplaintModal] = useState(false);
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [showChatWindow, setShowChatWindow] = useState(false);
    const [activeChatSession, setActiveChatSession] = useState<any>(null);
    const [selectedKost, setSelectedKost] = useState<any>(null);
    const [selectedSurvey, setSelectedSurvey] = useState<any>(null);
    const [showSurveySummaryModal, setShowSurveySummaryModal] = useState(false);
    const [selectedTrackingSurvey, setSelectedTrackingSurvey] = useState<any>(null);
    const [showTrackingModal, setShowTrackingModal] = useState(false);
    
    // Survey rating states
    const [showSurveyRatingModal, setShowSurveyRatingModal] = useState(false);
    const [selectedRatingSurvey, setSelectedRatingSurvey] = useState<any>(null);
    const [surveyRatingValue, setSurveyRatingValue] = useState(5);
    const [surveyRatingComment, setSurveyRatingComment] = useState('');

    // Sync selectedTrackingSurvey with updated list to reflect real-time updates
    useEffect(() => {
        if (selectedTrackingSurvey) {
            const updated = surveyRequests.find(s => s.id === selectedTrackingSurvey.id);
            if (updated) {
                setSelectedTrackingSurvey(updated);
            }
        }
    }, [surveyRequests]);

    // Rating form state
    const [ratingValue, setRatingValue] = useState(5);
    const [ratingComment, setRatingComment] = useState('');

    // Extension form state
    const [extensionPeriod, setExtensionPeriod] = useState(1);
    const [extensionTab, setExtensionTab] = useState<'form' | 'history'>('form');
    const [allUserTransactions, setAllUserTransactions] = useState<any[]>([]);
    const [extensionProof, setExtensionProof] = useState<File | null>(null);

    // Extra bill form state
    const [billName, setBillName] = useState('');
    const [billAmount, setBillAmount] = useState('');
    const [billProof, setBillProof] = useState<File | null>(null);

    // Complaint form state
    const [complaintTitle, setComplaintTitle] = useState('');
    const [complaintDesc, setComplaintDesc] = useState('');
    const [complaintCategory, setComplaintCategory] = useState('AC & Ventilasi');
    const [complaintUrgency, setComplaintUrgency] = useState<'NORMAL' | 'EMERGENCY'>('NORMAL');
    const [complaintPhoto, setComplaintPhoto] = useState<File | null>(null);
    const [complaintPhotoPreview, setComplaintPhotoPreview] = useState<string>('');

    const [recommendations, setRecommendations] = useState<any[]>([]);

    // Payment Gateway states
    const [showPaymentGateway, setShowPaymentGateway] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState(0);
    const [paymentOrderId, setPaymentOrderId] = useState('');
    const [paymentProductId, setPaymentProductId] = useState('');
    const [paymentProductType, setPaymentProductType] = useState<'kost_booking' | 'database' | 'survey'>('kost_booking');
    const [paymentMetadata, setPaymentMetadata] = useState<any>({});
    const [includeFacilityInExtension, setIncludeFacilityInExtension] = useState(true);
    const [residentStatus, setResidentStatus] = useState<any[]>([]);

    // Digital Receipt states
    const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);
    const [showDigitalReceiptModal, setShowDigitalReceiptModal] = useState<boolean>(false);

    // Interactive Card Details & Gallery states
    const [galleryModalOpen, setGalleryModalOpen] = useState<boolean>(false);
    const [galleryPhotos, setGalleryPhotos] = useState<string[]>([]);
    const [galleryTitle, setGalleryTitle] = useState<string>('');

    const handleOpenActiveReceipt = (kost: any) => {
        const kMeta = kost.metadata || {};
        const baseAmount = Number(kost.totalPrice || kMeta.total || kMeta.basePrice || 1);
        setSelectedReceipt({
            receiptNumber: kost.last_transaction_id ? `INV-${kost.last_transaction_id.substring(0, 8).toUpperCase()}` : (kost.id ? `INV-${kost.id.substring(0, 8).toUpperCase()}` : `INV-${Date.now().toString().slice(-8)}`),
            paidAt: kost.updated_at || kost.created_at || new Date().toISOString(),
            tenantName: kMeta.tenantName || kMeta.userName || user?.displayName || user?.name || 'Penghuni Kost',
            tenantPhone: kMeta.userPhone || user?.phoneNumber || user?.phone || '',
            propertyTitle: kost.kostName || 'Kost RuangSinggah',
            roomNumber: kost.roomNumber || kMeta.roomNumber || kost.roomType || 'Kamar',
            billingPeriod: kost.period || kMeta.periodLabel || 'Bulanan',
            newPeriodStart: kost.moveInDate || kMeta.startDate || '',
            newPeriodEnd: kost.endDate || kMeta.endDate || '',
            baseRent: baseAmount,
            extraFee: Number(kMeta.extraPersonFee || 0),
            extraFeeName: Number(kMeta.extraPersonFee || 0) > 0 ? 'Biaya Tambahan Penghuni' : undefined,
            totalAmount: baseAmount + Number(kMeta.extraPersonFee || 0),
            paymentMethod: (kMeta.payment_method || 'QRIS / Midtrans').toUpperCase()
        });
        setShowDigitalReceiptModal(true);
    };

    const handleOpenReceiptFromHistory = (trx: any) => {
        const tMeta = typeof trx.metadata === 'string' ? JSON.parse(trx.metadata) : (trx.metadata || {});
        const baseAmt = Number(trx.amount || tMeta.baseRent || tMeta.basePrice || (selectedKost ? selectedKost.totalPrice : 1));
        
        setSelectedReceipt({
            receiptNumber: trx.id ? `INV-${trx.id.substring(0, 8).toUpperCase()}` : `INV-${Date.now().toString().slice(-8)}`,
            paidAt: trx.updated_at || trx.created_at || new Date().toISOString(),
            tenantName: tMeta.tenantName || tMeta.userName || user?.displayName || user?.name || 'Penghuni Kost',
            tenantPhone: tMeta.userPhone || tMeta.phone || user?.phoneNumber || user?.phone || '',
            propertyTitle: (selectedKost ? selectedKost.kostName : null) || tMeta.propertyTitle || tMeta.kostName || 'Kost RuangSinggah',
            roomNumber: (selectedKost ? selectedKost.roomNumber : null) || tMeta.roomNumber || (selectedKost ? selectedKost.roomType : null) || 'Kamar',
            billingPeriod: (selectedKost ? selectedKost.period : null) || tMeta.periodLabel || 'Bulanan',
            newPeriodStart: tMeta.startDate || tMeta.leaseStart || (selectedKost ? selectedKost.moveInDate : '') || '',
            newPeriodEnd: tMeta.endDate || tMeta.leaseEnd || (selectedKost ? selectedKost.endDate : '') || '',
            baseRent: baseAmt,
            extraFee: Number(tMeta.extraPersonFee || 0),
            extraFeeName: Number(tMeta.extraPersonFee || 0) > 0 ? 'Biaya Tambahan Penghuni' : undefined,
            totalAmount: Number(trx.amount || (baseAmt + Number(tMeta.extraPersonFee || 0))),
            paymentMethod: (tMeta.payment_method || tMeta.paymentType || 'QRIS / Midtrans').toUpperCase()
        });
        setShowDigitalReceiptModal(true);
    };

    const handleReportIssueWhatsApp = (kost: any) => {
        const kMeta = kost.metadata || {};
        const tenantName = kMeta.tenantName || kMeta.userName || user?.displayName || user?.name || 'Penghuni';
        const roomName = kost.roomNumber || kMeta.roomNumber || kost.roomType || 'Kamar';
        const propertyTitle = kost.kostName || 'Kost';
        const adminWa = '6281527080656'; // Official KostManager / RuangSinggah Hotline

        const text = encodeURIComponent(
            `*LAPORAN KENDALA HUNIAN - RUANGSINGGAH*\n\n` +
            `Halo Tim Bantuan KostManager RuangSinggah,\n` +
            `Saya ingin melaporkan kendala pada hunian kost saya:\n\n` +
            `👤 *Nama Penghuni:* ${tenantName}\n` +
            `🏠 *Properti:* ${propertyTitle}\n` +
            `🚪 *Unit Kamar:* ${roomName}\n` +
            `📅 *Tanggal Lapor:* ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}\n\n` +
            `*Rincian Kendala / Kerusakan:*\n` +
            `[Tuliskan kendala Anda di sini, misal: Keran air bocor, WiFi mati, lampu kamar putus, dll.]\n\n` +
            `Mohon bantuannya untuk segera ditindaklanjuti. Terima kasih!`
        );

        window.open(`https://wa.me/${adminWa}?text=${text}`, '_blank');
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

    const handleOpenGallery = (photos: string[], title: string) => {
        if (!photos || photos.length === 0) return;
        setGalleryPhotos(photos);
        setGalleryTitle(title);
        setGalleryModalOpen(true);
    };




    useEffect(() => {
        if (user) {
            fetchMyKosts();

            // Realtime subscription for resident status
            const channel = supabase
                .channel('tenant-resident-status')
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'resident_status',
                    filter: `user_id=eq.${user.uid}`
                }, () => {
                    console.log('Resident status changed, refreshing...');
                    fetchMyKosts();
                })
                .subscribe();

            // Realtime subscription for survey requests
            const surveyChannel = supabase
                .channel('tenant-survey-requests')
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'survey_requests',
                    filter: `user_id=eq.${user.uid}`
                }, () => {
                    console.log('Survey requests changed, refreshing...');
                    fetchMyKosts();
                })
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
                supabase.removeChannel(surveyChannel);
            };
        } else {
            setLoading(false);
        }
    }, [user]);

    const handleOpenChat = async (kost: any) => {
        if (!user) return;
        const currentUid = user.uid || (user as any).id;
        if (!currentUid) {
            console.error('No valid user ID found for chat');
            alert('Gagal membuka chat: Pengguna belum login atau sesi telah kedaluwarsa.');
            return;
        }
        try {
            setIsSubmitting(true);

            // Ambil detail properti untuk mendapatkan info omnichannel
            const { data: propData, error: propError } = await supabase
                .from('properties')
                .select('owner_uid, title, omnichannel_contact_name, omnichannel_contact_type, is_managed')
                .eq('id', kost.kostId)
                .maybeSingle();

            if (propError) {
                console.warn('Property query warning in Supabase for chat:', propError);
            }

            const isManaged = Boolean(kost.isManagedKost || propData?.is_managed);
            const targetOwnerId = isManaged ? SYSTEM_ADMIN_ID : (propData?.owner_uid || SYSTEM_ADMIN_ID);

            const session = await getOrCreateChatSession(
                currentUid,
                targetOwnerId,
                kost.kostId || null,
                user.displayName || (user as any).name || user.email?.split('@')[0] || 'Penghuni',
                user.photoURL || (user as any).avatar_url || ''
            );

            setActiveChatSession({
                ...session,
                propertyName: propData?.title || kost.kostName || 'Kost Saya',
                contactName: isManaged ? 'Tim KostManager' : (propData?.omnichannel_contact_name || 'Pemilik Kost'),
                contactType: isManaged ? 'admin' : (propData?.omnichannel_contact_type || 'owner')
            });
            setShowChatWindow(true);
        } catch (error: any) {
            console.error('Failed to open chat:', error);
            alert(`Gagal membuka chat: ${error?.message || 'Pastikan koneksi internet stabil atau hubungi sistem admin RuangSinggah.'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancelBooking = async (kost: any) => {
        if (!confirm(`Apakah Anda yakin ingin membatalkan pengajuan sewa untuk ${kost.kostName}? Tindakan ini tidak dapat dibatalkan.`)) {
            return;
        }

        try {
            setIsSubmitting(true);
            const sessionId = kost.metadata?.booking_session_id;
            await cancelBookingRequest(kost.id, sessionId);
            alert('Pengajuan sewa berhasil dibatalkan.');
            await fetchMyKosts(); // Refresh list
        } catch (error) {
            console.error('Failed to cancel booking:', error);
            alert('Gagal membatalkan pengajuan. Silakan coba lagi nanti.');
        } finally {
            setIsSubmitting(false);
        }
    };


    const fetchMyKosts = async () => {
        setLoading(true);
        // Auto-sync missing survey requests in background
        autoSyncAllSurveys(user.uid).catch(console.error);
        try {
            // 1. Fetch Resident Status first to get the IDs for history matching
            const { data: statusData, error: statusError } = await supabase
                .from('resident_status')
                .select('*')
                .eq('user_id', user.uid);

            if (statusError) throw statusError;

            // 2. FETCH BILLS: Ambil semua transaksi milik user INI
            const residentIds = statusData?.map((r: any) => r.id).filter(Boolean) || [];
            const idFilter = residentIds.length > 0 ? `,resident_status_id.in.(${residentIds.join(',')})` : '';

            const { data: bills, error: billsErr } = await supabase
                .from('transactions')
                .select('*')
                .or(`user_id.eq.${user.uid}${idFilter}`);

            if (billsErr) console.error("FETCH_BILLS_ERROR:", billsErr);
            setAllUserTransactions(bills || []);

            // Merge both data sources and remove duplicates by ID or specific logic
            // Priority: resident_status has more info for active tenants, transactions for pending bookings
            const combinedData = [...(statusData || [])];

            // Add transactions that are not already linked to a resident_status (to avoid duplicates)
            const activeResidentsOnly = (statusData || []).filter((r: any) => (r.status || 'ACTIVE').toUpperCase() === 'ACTIVE');
            const linkedTrxIds = new Set(statusData?.map((r: any) => r.transaction_id).filter(Boolean));
            const activeKostIds = new Set(activeResidentsOnly.map((r: any) => r.kost_id).filter(Boolean));

            (bills || []).forEach((trx: any) => {
                const trxId = trx.id;
                const trxKostId = trx.product_id || trx.kost_id;

                // Only add if not linked by TRX_ID AND NOT for a kost that is ALREADY ACTIVE
                if (!linkedTrxIds.has(trxId) && !activeKostIds.has(trxKostId)) {
                    // Check if it's a rent-related transaction
                    const pType = (trx.product_type || trx.type || '').toLowerCase();
                    if (['rent', 'kost_booking', 'kost'].includes(pType) || trx.category === 'kost') {
                        combinedData.push(trx);
                    }
                }
            });

            const data = combinedData;
            const error = statusError || billsErr;

            if (error) {
                console.error('fetchMyKosts error:', error);
                throw error;
            }

            console.log(`DEBUG_MYKOST: Fetched ${data?.length || 0} transactions for user ${user.uid}`);
            if (data && data.length > 0) {
                data.forEach(t => {
                    console.log(`DEBUG_MYKOST: TrxID: ${t.id}, Status: ${t.status}, Type: ${t.product_type || t.type}`);
                    console.log(`DEBUG_MYKOST: Metadata:`, t.metadata);
                });
            }

            if (data && data.length > 0) {
                // Batch fetch unique properties since join might fail due to FK issues
                const productIds = Array.from(new Set(data?.map(d => d.product_id || d.kost_id).filter(id => !!id)));
                const { data: propertiesData } = await supabase
                    .from('properties')
                    .select('id, title, address, image_urls, owner_uid, city, area, additional_fee_name, additional_fee_price, additional_fee_starts_from, room_types, location, facilities, rules, metadata, is_managed')
                    .in('id', productIds);

                const propMap = (propertiesData || []).reduce((acc: any, p: any) => {
                    acc[p.id] = p;
                    return acc;
                }, {});

                // Fallback: If any property is not found in properties table, check mitra_kostmanager
                const missingIds = productIds.filter(id => !propMap[id]);
                if (missingIds.length > 0) {
                    const { data: kmProps } = await supabase
                        .from('mitra_kostmanager')
                        .select('id, property_id, title, address, image_urls, owner_uid, city, area, room_types, location, facilities, rules')
                        .or(`id.in.(${missingIds.join(',')}),property_id.in.(${missingIds.join(',')})`);

                    (kmProps || []).forEach((kp: any) => {
                        if (kp.id) propMap[kp.id] = { ...kp, is_managed: true };
                        if (kp.property_id) propMap[kp.property_id] = { ...kp, is_managed: true };
                    });
                }

                const kostsData: any[] = [];
                data?.forEach((doc) => {
                    const productType = (doc.product_type || doc.type || '').toLowerCase();
                    const isRent = ['rent', 'kost_booking', 'kost'].includes(productType) || doc.category === 'kost';
                    const statusLower = (doc.status || '').toLowerCase();
                    const isApproved = ['approved', 'paid', 'selesai', 'success', 'berhasil'].includes(statusLower);
                    const isPendingApproval = statusLower === 'pending_approval';
                    const isAwaitingPayment = statusLower === 'awaiting_payment';
                    const isRejected = statusLower === 'rejected';
                    const isCancelled = statusLower === 'cancelled';

                    if (isRent && (isApproved || isPendingApproval || isAwaitingPayment || isRejected || isCancelled)) {
                        let daysRem = null;
                        const metadata = doc.metadata || {};
                        if (metadata.endDate) {
                            // Use a safe parsing logic similar to FORMAT_DATE but for calculation
                            let end = new Date(metadata.endDate);

                            // Fallback for Indonesian locale strings
                            if (isNaN(end.getTime()) && typeof metadata.endDate === 'string') {
                                const months: Record<string, number> = {
                                    'januari': 0, 'februari': 1, 'maret': 2, 'april': 3, 'mei': 4, 'juni': 5,
                                    'juli': 6, 'agustus': 7, 'september': 8, 'oktober': 9, 'november': 10, 'desember': 11
                                };
                                const parts = metadata.endDate.toLowerCase().split(' ');
                                if (parts.length >= 3) {
                                    const day = parseInt(parts[0]);
                                    const month = months[parts[1]];
                                    const year = parseInt(parts[2]);
                                    if (!isNaN(day) && month !== undefined && !isNaN(year)) {
                                        end = new Date(year, month, day);
                                    }
                                }
                            }

                            if (!isNaN(end.getTime())) {
                                // Normalize today and end date to start of day (00:00:00) for clean day calculation
                                const today = getCurrentDate();
                                const tNorm = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                                const eNorm = new Date(end.getFullYear(), end.getMonth(), end.getDate());

                                const diff = eNorm.getTime() - tNorm.getTime();
                                daysRem = Math.ceil(diff / (1000 * 60 * 60 * 24));
                            }
                        }

                        const prop = propMap[doc.product_id || doc.kost_id];
                        const targetRoomNum = (metadata.roomNumber || metadata.variantName || doc.room_number || '').trim();
                        const propRooms = prop?.room_types || [];
                        const currentRoom = propRooms.find((rm: any) => {
                            const rName = (rm.name || rm.roomNumber || '').trim();
                            if (!rName && !targetRoomNum) return false;
                            if (targetRoomNum && rName.toLowerCase() === targetRoomNum.toLowerCase()) return true;
                            const rNumOnly = rName.replace(/^kamar\s*/i, '').trim().toLowerCase();
                            const tNumOnly = targetRoomNum.replace(/^kamar\s*/i, '').trim().toLowerCase();
                            if (rNumOnly && tNumOnly && rNumOnly === tNumOnly) return true;
                            return false;
                        }) || (propRooms.length === 1 ? propRooms[0] : null);

                        const normalizePhotoUrl = (raw: any): string => {
                            if (!raw) return '';
                            const path = typeof raw === 'string' ? raw : (raw.url || raw.original || raw.webp || '');
                            if (!path) return '';
                            if (path.startsWith('http') || path.startsWith('data:')) return path;
                            return supabase.storage.from('properties').getPublicUrl(path).data?.publicUrl || path;
                        };

                        let roomPhotos: string[] = [];
                        if (currentRoom?.images && Array.isArray(currentRoom.images) && currentRoom.images.length > 0) {
                            roomPhotos = currentRoom.images.map(normalizePhotoUrl).filter(Boolean);
                        } else if (currentRoom?.categorized_photos && typeof currentRoom.categorized_photos === 'object') {
                            Object.values(currentRoom.categorized_photos).forEach((photos: any) => {
                                if (Array.isArray(photos)) {
                                    photos.forEach((p: any) => {
                                        const url = normalizePhotoUrl(p);
                                        if (url && !roomPhotos.includes(url)) roomPhotos.push(url);
                                    });
                                }
                            });
                        }

                        let displayImg = null;
                        if (roomPhotos.length > 0) {
                            displayImg = roomPhotos[0];
                        } else {
                            const rawImages = prop?.image_urls || doc.image_urls || metadata.imageUrls || [];
                            const frontBuildingImg = rawImages.find((img: any) => {
                                const label = (img?.label || '').toLowerCase();
                                return label.includes('bangunan depan') || label.includes('fasad') || label.includes('depan');
                            });
                            const chosenImg = frontBuildingImg || rawImages[0];
                            if (chosenImg) {
                                displayImg = normalizePhotoUrl(chosenImg);
                            }
                        }

                        kostsData.push({
                            id: doc.id,
                            kostName: prop?.title || doc.properties?.title || doc.kost_name || metadata.kostName,
                            kostId: prop?.id || doc.properties?.id || doc.kost_id || doc.product_id,
                            roomType: doc.room_type || metadata.roomType,
                            roomNumber: targetRoomNum || currentRoom?.name || currentRoom?.roomNumber || doc.room_type || metadata.roomType || 'Kamar',
                            roomFloor: currentRoom?.floor || null,
                            roomSize: currentRoom?.dimensions || currentRoom?.size || null,
                            roomFacilities: currentRoom?.roomFacilities || currentRoom?.facilities || [],
                            bathroomType: currentRoom?.bathroomType || (currentRoom?.bathroomFacilities?.length ? 'Kamar Mandi Dalam' : 'Kamar Mandi Luar'),
                            roomPhotos: roomPhotos,
                            isManagedKost: prop?.is_managed === true || doc.is_managed_kost === true || metadata.is_managed_kost === true || metadata.isManaged === true || metadata.managed_by === 'kostmanager',
                            address: prop?.address || doc.address || metadata.address || '',
                            areaCity: [prop?.area, prop?.city].filter(Boolean).join(', ') || '',
                            propertyFacilities: prop?.facilities || [],
                            propertyRules: prop?.rules || [],
                            ownerUid: prop?.owner_uid || doc.owner_uid,
                            currentRoom: currentRoom,
                            duration: doc.duration || metadata.duration,
                            period: (doc.period || metadata.periodLabel || 'Bulan').replace(/per\s+/i, '').replace(/bulanan/i, 'Bulan'),
                            moveInDate: doc.move_in_date || metadata.startDate,
                            endDate: metadata.endDate,
                            daysRemaining: daysRem,
                            totalPrice: (isPendingApproval || isAwaitingPayment)
                                ? Number(doc.amount || 0)
                                : (metadata.basePrice
                                    ? (Number(metadata.basePrice) + Number(metadata.extraPersonFee || 0))
                                    : (Number(doc.amount || 0) - Number(metadata.facilityFee || prop?.additional_fee_price || 0))),
                            displayImage: displayImg,
                            rejection_reason: metadata.rejection_reason || metadata.rejectionReason,
                            additionalFeePrice: prop?.additional_fee_price,
                            additionalFeeName: prop?.additional_fee_name,
                            additionalFeeStartsFrom: prop?.additional_fee_starts_from,
                            room_types: prop?.room_types,
                            basePrice: prop?.price,
                            location: prop?.location || doc.location || metadata.location,
                            ...doc
                        });
                    }
                });

            // Fetch actual resident status (Source of Truth for Aktif tab & Checkout recognition)
            const statusRecords = await getResidentStatus({ userId: user.uid });
            const checkedOutSessionIds = new Set(
                (statusRecords || [])
                    .filter((r: any) => (r.status || '').toUpperCase() === 'CHECKED_OUT')
                    .map((r: any) => r.metadata?.booking_session_id)
                    .filter(Boolean)
            );
            const checkedOutTrxIds = new Set(
                (statusRecords || [])
                    .filter((r: any) => (r.status || '').toUpperCase() === 'CHECKED_OUT')
                    .flatMap((r: any) => [r.last_transaction_id, ...(r.metadata?.processed_transactions || [])])
                    .filter(Boolean)
            );

            // De-duplicate by session or lifecycle so that in-flight applications are NEVER overwritten by past paid leases
            // Priority: PAID > AWAITING_PAYMENT > PENDING_APPROVAL > REJECTED/CANCELLED
            const statusPriority: Record<string, number> = {
                'paid': 4, 'approved': 4, 'selesai': 4, 'success': 4, 'berhasil': 4,
                'awaiting_payment': 3,
                'pending_approval': 2,
                'rejected': 1, 'cancelled': 1
            };

            const uniqueKosts = Object.values(kostsData.reduce((acc: Record<string, any>, curr: any) => {
                const statusLower = (curr.status || '').toLowerCase();
                const isInFlight = ['pending_approval', 'awaiting_payment', 'pending'].includes(statusLower);

                // Group split transactions by booking_session_id if present
                // Distinguish between in-flight applications and separate historical transactions
                const sessionKey = curr.metadata?.booking_session_id 
                    ? `session_${curr.metadata.booking_session_id}` 
                    : (isInFlight ? `pending_${curr.kostId}_${(curr.roomType || '').toLowerCase()}_${curr.id}` : `history_${curr.kostId}_${(curr.roomType || '').toLowerCase()}_${curr.id}`);

                if (!acc[sessionKey]) {
                    acc[sessionKey] = curr;
                } else {
                    const existingStatus = (acc[sessionKey].status || '').toLowerCase();
                    const currentStatus = (curr.status || '').toLowerCase();

                    const pExisting = statusPriority[existingStatus] || 0;
                    const pCurrent = statusPriority[currentStatus] || 0;

                    if (pCurrent > pExisting) {
                        acc[sessionKey] = curr;
                    } else if (pCurrent === pExisting) {
                        // If priority is same, take the latest one
                        const tExisting = new Date(acc[sessionKey].created_at || 0).getTime();
                        const tCurrent = new Date(curr.created_at || 0).getTime();
                        if (tCurrent > tExisting) {
                            acc[sessionKey] = curr;
                        }
                    }
                }
                return acc;
            }, {}));

            // Use the bills fetched at the start of fetchMyKosts

            // Associate extra bills with real kosts
            const filteredBills = (bills || []).filter(b => {
                const meta = typeof b.metadata === 'string' ? JSON.parse(b.metadata) : (b.metadata || {});
                return !meta.is_batch_parent;
            });

            const activeWithBills = uniqueKosts.map(k => {
                const isCheckedOutResident = checkedOutTrxIds.has(k.id) || 
                    (k.metadata?.booking_session_id && checkedOutSessionIds.has(k.metadata.booking_session_id)) ||
                    k.metadata?.resident_status === 'CHECKED_OUT' ||
                    Boolean(k.metadata?.checkout_at);

                const pendBills = filteredBills.filter(b => {
                    const bid = (b.product_id || b.kost_id || '').toString();
                    const kid = (k.kostId || '').toString();
                    const isSameKost = bid === kid || b.metadata?.kostId === kid;
                    const s = (b.status || '').toLowerCase();
                    const isPaid = ['paid', 'success', 'berhasil', 'settlement', 'capture', 'completed', 'done'].includes(s);

                    const kostSessionId = k.metadata?.booking_session_id;
                    const billSessionId = b.metadata?.booking_session_id;

                    // 1. Filter Ketat Sesi (Hanya tampilkan tagihan milik sesi aktif ini)
                    if (kostSessionId) {
                        return isSameKost && billSessionId === kostSessionId;
                    }

                    // Jika tidak ada sesi aktif, jangan tampilkan tagihan ekstra sembarangan
                    return false;
                });
                // Only count UNPAID bills for the dashboard total
                const totalPend = pendBills.filter(b => {
                    const s = (b.status || '').toLowerCase();
                    return !['paid', 'success', 'berhasil', 'settlement', 'capture', 'completed', 'done'].includes(s);
                }).reduce((acc, b) => acc + (b.amount || 0), 0);
                return { 
                    ...k, 
                    is_checked_out: isCheckedOutResident,
                    pendingBills: pendBills, 
                    totalPendingBills: totalPend 
                };
            });

            // Map resident status to match the UI expectations of activeKosts
            // HANYA sertakan data yang berstatus ACTIVE untuk hunian berjalan di tab Aktif
            const activeStatusRecords = (statusRecords || []).filter(r => (r.status || 'ACTIVE').toUpperCase() === 'ACTIVE');
            const processedActive = activeStatusRecords.map(r => {
                const prop = r.property || {};
                const lastTrx = r.last_transaction || {};

                // Days remaining logic
                let daysRem = null;
                if (r.end_date) {
                    const today = getCurrentDate();
                    const tNorm = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                    const eDate = new Date(r.end_date);
                    const eNorm = new Date(eDate.getFullYear(), eDate.getMonth(), eDate.getDate());
                    const diff = eNorm.getTime() - tNorm.getTime();
                    daysRem = Math.ceil(diff / (1000 * 60 * 60 * 24));
                }

                const rMeta = r.metadata || {};
                const lastTrxMeta = (r.last_transaction || {}).metadata || {};
                const combinedMeta = { ...lastTrxMeta, ...rMeta };

                // Extract room information and photos
                const targetRoomNum = (rMeta.roomNumber || rMeta.variantName || r.room_number || combinedMeta.roomNumber || lastTrxMeta.roomNumber || '').trim();
                const propRooms = prop.room_types || [];
                const currentRoom = propRooms.find((rm: any) => {
                    const rName = (rm.name || rm.roomNumber || '').trim();
                    if (!rName && !targetRoomNum) return false;
                    if (targetRoomNum && rName.toLowerCase() === targetRoomNum.toLowerCase()) return true;
                    const rNumOnly = rName.replace(/^kamar\s*/i, '').trim().toLowerCase();
                    const tNumOnly = targetRoomNum.replace(/^kamar\s*/i, '').trim().toLowerCase();
                    if (rNumOnly && tNumOnly && rNumOnly === tNumOnly) return true;
                    return false;
                }) || (propRooms.length === 1 ? propRooms[0] : null);

                let roomPhotos: string[] = [];
                if (currentRoom?.images && Array.isArray(currentRoom.images) && currentRoom.images.length > 0) {
                    roomPhotos = currentRoom.images.filter(Boolean);
                } else if (currentRoom?.categorized_photos && typeof currentRoom.categorized_photos === 'object') {
                    Object.values(currentRoom.categorized_photos).forEach((photos: any) => {
                        if (Array.isArray(photos)) {
                            photos.forEach((p: any) => { if (typeof p === 'string' && p && !roomPhotos.includes(p)) roomPhotos.push(p); });
                        }
                    });
                }

                // Image resolution: Prioritize actual room photo over building diagram
                let displayImg = null;
                if (roomPhotos.length > 0) {
                    displayImg = roomPhotos[0];
                } else {
                    const rawImages = prop.image_urls || [];
                    const frontBuildingImg = rawImages.find((img: any) => {
                        const label = (img?.label || '').toLowerCase();
                        return label.includes('bangunan depan') || label.includes('fasad') || label.includes('depan');
                    });
                    const chosenImg = frontBuildingImg || rawImages[0];
                    if (chosenImg) {
                        const path = typeof chosenImg === 'string' ? chosenImg : (chosenImg.original || chosenImg.url || chosenImg.webp || '');
                        if (path) {
                            displayImg = path.startsWith('http') ? path : supabase.storage.from('properties').getPublicUrl(path).data.publicUrl;
                        }
                    }
                }

                const pendBills = (bills || []).filter(b => {
                    const bid = (b.product_id || b.kost_id || '').toString();
                    const kid = (r.kost_id || '').toString();
                    const isSameKost = bid === kid || b.metadata?.kostId === kid;

                    const s = (b.status || '').toLowerCase();
                    const isPaidStatus = ['paid', 'success', 'berhasil', 'settlement', 'capture', 'completed', 'done'].includes(s);
                    const isRelevantStatus = ['pending', 'awaiting_payment', 'paid', 'success', 'berhasil', 'settlement', 'capture', 'completed', 'done'].includes(s);

                    // [FIX] Jangan tampilkan tagihan 'failed' atau 'expired' — ini zombie dari percobaan bayar yang gagal
                    const isZombie = ['failed', 'expired', 'cancel', 'deny'].includes(s);
                    if (isZombie) return false;

                    const kostSessionId = (r.metadata || combinedMeta)?.booking_session_id;
                    const billSessionId = b.metadata?.booking_session_id;
                    const billResidentId = String(b.metadata?.resident_status_id || b.resident_status_id || '').trim().toLowerCase();
                    const currentResId = String(r.id).trim().toLowerCase();
                    const allRelatedResidentIds = [currentResId, ...(r.allResidentIds || []).map((id: any) => String(id).trim().toLowerCase())];

                    const isPaid = ['paid', 'success', 'berhasil', 'settlement', 'capture', 'completed', 'done'].includes(s);

                    // 1. ULTRA PERMISSIVE HISTORY: Jika sudah LUNAS dan untuk Kost ini, TAMPILKAN!
                    // Kita tidak boleh menyembunyikan riwayat pembayaran asli dari database.
                    if (isPaid && isSameKost) {
                        return true;
                    }

                    // 2. Jika BELUM LUNAS (Pending/Active), gunakan filter ketat agar tagihan sesi lama tidak muncul
                    if (!isPaid && billResidentId === currentResId) {
                        return true;
                    }

                    // 3. Fallback untuk data lama (Legacy)
                    if (!billResidentId && !isPaid) {
                        const kostSessionId = (r.metadata || combinedMeta)?.booking_session_id;
                        const billSessionId = b.metadata?.booking_session_id;
                        if (kostSessionId && billSessionId === kostSessionId) return true;
                    }

                    // Fallback untuk tagihan pending (Tetap gunakan sesi agar tidak campur dengan hunian lama)
                    if (kostSessionId && !isPaid) {
                        return isSameKost && isRelevantStatus && (billSessionId === kostSessionId);
                    }

                    // Jika tidak punya sesi tapi milik hunian ini, izinkan
                    return isSameKost && isRelevantStatus && (billResidentId === currentResId);

                    // Jika tidak ada ID yang cocok secara eksplisit, jangan tampilkan apa pun
                    return false;

                    // Jika tidak ada ID yang cocok, jangan tampilkan apa pun (No more leaks!)
                    return false;

                    // Jika sesi aktif TIDAK ada (Legacy System), baru pakai fallback tanggal
                    const billDate = new Date(b.created_at);
                    const startDate = new Date(r.start_date);
                    startDate.setDate(startDate.getDate() - 7);
                    return isSameKost && isRelevantStatus && billDate >= startDate;
                });
                const totalPend = pendBills.reduce((acc, b) => acc + (b.amount || 0), 0);

                return {
                    ...r, // Spread base first
                    id: r.id,                                        // PRIMARY KEY — selalu unik, dipakai sebagai React key
                    transactionId: r.last_transaction_id || r.id,   // ID transaksi untuk keperluan pembayaran
                    residentStatusId: r.id,
                    kostName: prop.title || r.kost_name || combinedMeta.kostName || 'Kost Saya',
                    kostId: r.kost_id,
                    roomType: (() => {
                        const rt1 = r.room_type || '';
                        const rt2 = lastTrx.room_type || '';
                        if (rt1 && !rt1.toLowerCase().includes('sewa')) return rt1;
                        if (rt2 && !rt2.toLowerCase().includes('sewa')) return rt2;
                        return 'Kamar Standard';
                    })(),
                    pendingBills: pendBills,
                    totalPendingBills: totalPend,
                    // PAKET SEWA = current active package (from last sync/extension metadata)
                    // NOT total_months which is the accumulated total
                    duration: (() => {
                        // Priority: from resident_status.metadata.paketSewa (set by syncResidentStatus)
                        if (rMeta.paketSewa) return parseInt(rMeta.paketSewa) || 1;
                        // From last transaction's extensionPeriod
                        if (lastTrxMeta.extensionPeriod) return Number(lastTrxMeta.extensionPeriod);
                        if (lastTrxMeta.duration) return Number(lastTrxMeta.duration);
                        // Fallback: if only 1 transaction exists, duration = total_months
                        return 1;
                    })(),
                    // TOTAL MASA SEWA = accumulated months (booking + all extensions)
                    totalMonths: r.total_months || 1,
                    transactionDuration: lastTrx.duration || combinedMeta.duration || 1,
                    // [FIX] Sanitize period: reject corrupt values like "2 bulan" stored from old extension sync.
                    // Only accept valid kost billing cycle keys.
                    period: (() => {
                        const raw = (combinedMeta.period || combinedMeta.periodLabel || prop?.period || 'bulanan').toLowerCase().trim();
                        const validPeriods = ['bulanan', '3bulanan', '6bulanan', 'tahunan'];
                        return validPeriods.includes(raw) ? raw : 'bulanan';
                    })(),
                    moveInDate: r.start_date,
                    endDate: r.end_date,
                    daysRemaining: daysRem,
                    totalPrice: (() => {
                        const baseRent = Number(combinedMeta.baseRent || combinedMeta.basePrice || 0);
                        const extraFee = Number(combinedMeta.extraPersonFee || 0);

                        // Jika ini transaksi sewa/booking/perpanjangan, tampilkan harga PER BULAN (Base + EP)
                        if (baseRent > 0) {
                            return baseRent + extraFee;
                        }

                        // Fallback ke amount transaksi jika tidak ada metadata detail
                        return lastTrx.amount || prop.price || 0;
                    })(),
                    displayImage: displayImg,
                    roomNumber: targetRoomNum || currentRoom?.name || currentRoom?.roomNumber || r.room_type || 'Kamar 3',
                    roomFloor: currentRoom?.floor || null,
                    roomSize: currentRoom?.dimensions || currentRoom?.size || null,
                    roomFacilities: currentRoom?.roomFacilities || currentRoom?.facilities || [],
                    bathroomType: currentRoom?.bathroomType || (currentRoom?.bathroomFacilities?.length ? 'Kamar Mandi Dalam' : 'Kamar Mandi Luar'),
                    roomPhotos: roomPhotos,
                    isManagedKost: prop.is_managed === true || combinedMeta.is_managed_kost === true || combinedMeta.isManaged === true || combinedMeta.managed_by === 'kostmanager',
                    address: prop.address || combinedMeta.address || '',
                    areaCity: [prop.area, prop.city].filter(Boolean).join(', ') || '',
                    propertyFacilities: prop.facilities || [],
                    propertyRules: prop.rules || [],
                    ownerUid: prop.owner_uid,
                    currentRoom: currentRoom,
                    location: prop.location,
                    additionalFeePrice: prop.additional_fee_price,
                    additionalFeeName: prop.additional_fee_name,
                    additionalFeeStartsFrom: prop.additional_fee_starts_from,
                    room_types: prop.room_types,
                    basePrice: prop.price,
                    status: r.status || 'ACTIVE', // Ensure status is preserved from DB
                    occupants: Number(r.metadata?.occupants || combinedMeta.occupants || 1),
                    metadata: combinedMeta
                };
            });            // SMART DEDUPLICATION: Selalu tampilkan record dengan tanggal berakhir paling jauh (terupdate)
            const uniqueActive = processedActive.reduce((acc: any[], current: any) => {
                const existingIdx = acc.findIndex(item => item.kostId === current.kostId);
                if (existingIdx > -1) {
                    const existing = acc[existingIdx];

                    // Maintain historical IDs for comprehensive history matching
                    const allIds = Array.from(new Set([...(existing.allResidentIds || [existing.id]), current.id]));

                    // MEGA MERGE: Combine all transactions from all related resident records
                    const mergedBills = [...(existing.pendingBills || []), ...(current.pendingBills || [])]
                        .filter((v, i, a) => a.findIndex(t => t.id === v.id) === i); // Deduplicate by transaction ID

                    const currentDate = new Date(current.endDate || current.end_date || 0).getTime();
                    const existingDate = new Date(existing.endDate || existing.end_date || 0).getTime();

                    if (currentDate > existingDate) {
                        // Current is newer: Use it but keep the collected historical IDs and merged bills
                        acc[existingIdx] = { ...current, allResidentIds: allIds, pendingBills: mergedBills };
                    } else {
                        // Existing is newer/equal: Keep it but update its historical IDs and merged bills
                        acc[existingIdx] = { ...existing, allResidentIds: allIds, pendingBills: mergedBills };
                    }
                    return acc;
                }
                // First time seeing this kost: Initialize with its own ID
                acc.push({ ...current, allResidentIds: [current.id] });
                return acc;
            }, []);

            // [NEW] Injeksi Data Klaim Sewa KostManager dari Magic Link WhatsApp
            const rawClaim = localStorage.getItem('rs_active_tenant_claim');
            if (rawClaim) {
                try {
                    const claim = JSON.parse(rawClaim);
                    const alreadyInActive = uniqueActive.some((k: any) => k.kostId === claim.propertyId);
                    if (!alreadyInActive && claim.propertyId) {
                        const { data: claimProp } = await supabase
                            .from('properties')
                            .select('id, title, image_urls, owner_uid, city, area, price, room_types, location, additional_fee_price, additional_fee_name, additional_fee_starts_from')
                            .eq('id', claim.propertyId)
                            .maybeSingle();

                        if (claimProp) {
                            let end = new Date(claim.dueDate);
                            let daysRem = null;
                            if (!isNaN(end.getTime())) {
                                const today = getCurrentDate();
                                const tNorm = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                                const eNorm = new Date(end.getFullYear(), end.getMonth(), end.getDate());
                                daysRem = Math.ceil((eNorm.getTime() - tNorm.getTime()) / (1000 * 60 * 60 * 24));
                            }

                            let displayImg = null;
                            if (claimProp.image_urls && claimProp.image_urls.length > 0) {
                                const img = claimProp.image_urls[0];
                                const path = typeof img === 'string' ? img : (img.original || img.webp || '');
                                if (path) {
                                    displayImg = path.startsWith('http') ? path : supabase.storage.from('properties').getPublicUrl(path).data.publicUrl;
                                }
                            }

                            uniqueActive.push({
                                id: `claim_${claim.propertyId}_${claim.roomNumber}`,
                                transactionId: `trx_claim_${claim.propertyId}`,
                                residentStatusId: `claim_${claim.propertyId}`,
                                kostName: claimProp.title || claim.propertyTitle || 'Kost Terkelola',
                                kostId: claimProp.id,
                                roomType: claim.roomType || `Kamar No. ${claim.roomNumber}`,
                                room_number: claim.roomNumber,
                                duration: 1,
                                period: claim.billingPeriod || 'bulanan',
                                moveInDate: claim.newPeriodStart || claim.previousPeriodStart || claim.periodStart || new Date().toISOString(),
                                endDate: claim.newPeriodEnd || claim.dueDate,
                                end_date: claim.newPeriodEnd || claim.dueDate,
                                start_date: claim.newPeriodStart || claim.previousPeriodStart || claim.periodStart || new Date().toISOString(),
                                daysRemaining: daysRem,
                                totalPrice: Number(claim.monthlyPrice || claimProp.price || 0),
                                displayImage: displayImg,
                                status: 'ACTIVE',
                                is_managed_kost: true,
                                tenant_name: claim.tenantName,
                                tenant_phone: claim.phone,
                                basePrice: Number(claim.monthlyPrice || claimProp.price || 0) - Number(claim.extraFee || 0),
                                location: claimProp.location,
                                additionalFeePrice: claimProp.additional_fee_price,
                                additionalFeeName: claimProp.additional_fee_name,
                                additionalFeeStartsFrom: claimProp.additional_fee_starts_from,
                                room_types: claimProp.room_types,
                                occupants: 1,
                                pendingBills: [],
                                totalPendingBills: 0,
                                metadata: {
                                    isKostManagerClaim: true,
                                    roomNumber: claim.roomNumber,
                                    tenantName: claim.tenantName,
                                    tenantPhone: claim.phone,
                                    billingPeriod: claim.billingPeriod,
                                    previousPeriodStart: claim.previousPeriodStart,
                                    previousPeriodEnd: claim.previousPeriodEnd,
                                    newPeriodStart: claim.newPeriodStart,
                                    newPeriodEnd: claim.newPeriodEnd,
                                    extraFee: claim.extraFee,
                                    extraFeeName: claim.extraFeeName,
                                    extraPersonFee: claim.extraFee,
                                    basePrice: Number(claim.monthlyPrice || claimProp.price || 0) - Number(claim.extraFee || 0),
                                    paketSewa: 1
                                }
                            });
                        }
                    }
                } catch (err) {
                    console.warn('Failed to parse active tenant claim:', err);
                }
            }

                setResidentStatus(uniqueActive);
                setActiveKosts(activeWithBills);
            } else {
                // Fallback untuk user baru yang belum ada transaksi tetapi memiliki claim sewa
                const rawClaim = localStorage.getItem('rs_active_tenant_claim');
                if (rawClaim) {
                    try {
                        const claim = JSON.parse(rawClaim);
                        if (claim.propertyId) {
                            const { data: claimProp } = await supabase
                                .from('properties')
                                .select('id, title, image_urls, owner_uid, city, area, price, room_types, location, additional_fee_price, additional_fee_name, additional_fee_starts_from')
                                .eq('id', claim.propertyId)
                                .maybeSingle();

                            if (claimProp) {
                                let end = new Date(claim.newPeriodEnd || claim.dueDate);
                                let daysRem = null;
                                if (!isNaN(end.getTime())) {
                                    const today = getCurrentDate();
                                    const tNorm = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                                    const eNorm = new Date(end.getFullYear(), end.getMonth(), end.getDate());
                                    daysRem = Math.ceil((eNorm.getTime() - tNorm.getTime()) / (1000 * 60 * 60 * 24));
                                }

                                let displayImg = null;
                                if (claimProp.image_urls && claimProp.image_urls.length > 0) {
                                    const img = claimProp.image_urls[0];
                                    const path = typeof img === 'string' ? img : (img.original || img.webp || '');
                                    if (path) {
                                        displayImg = path.startsWith('http') ? path : supabase.storage.from('properties').getPublicUrl(path).data.publicUrl;
                                    }
                                }

                                const claimedItem = {
                                    id: `claim_${claim.propertyId}_${claim.roomNumber}`,
                                    transactionId: `trx_claim_${claim.propertyId}`,
                                    residentStatusId: `claim_${claim.propertyId}`,
                                    kostName: claimProp.title || claim.propertyTitle || 'Kost Terkelola',
                                    kostId: claimProp.id,
                                    roomType: claim.roomType || `Kamar No. ${claim.roomNumber}`,
                                    room_number: claim.roomNumber,
                                    duration: 1,
                                    period: claim.billingPeriod || 'bulanan',
                                    moveInDate: claim.newPeriodStart || claim.previousPeriodStart || claim.periodStart || new Date().toISOString(),
                                    endDate: claim.newPeriodEnd || claim.dueDate,
                                    end_date: claim.newPeriodEnd || claim.dueDate,
                                    start_date: claim.newPeriodStart || claim.previousPeriodStart || claim.periodStart || new Date().toISOString(),
                                    daysRemaining: daysRem,
                                    totalPrice: Number(claim.monthlyPrice || claimProp.price || 0),
                                    displayImage: displayImg,
                                    status: 'ACTIVE',
                                    is_managed_kost: true,
                                    tenant_name: claim.tenantName,
                                    tenant_phone: claim.phone,
                                    basePrice: Number(claim.monthlyPrice || claimProp.price || 0) - Number(claim.extraFee || 0),
                                    location: claimProp.location,
                                    additionalFeePrice: claimProp.additional_fee_price,
                                    additionalFeeName: claimProp.additional_fee_name,
                                    additionalFeeStartsFrom: claimProp.additional_fee_starts_from,
                                    room_types: claimProp.room_types,
                                    occupants: 1,
                                    pendingBills: [],
                                    totalPendingBills: 0,
                                    metadata: {
                                        isKostManagerClaim: true,
                                        roomNumber: claim.roomNumber,
                                        tenantName: claim.tenantName,
                                        tenantPhone: claim.phone,
                                        billingPeriod: claim.billingPeriod,
                                        previousPeriodStart: claim.previousPeriodStart,
                                        previousPeriodEnd: claim.previousPeriodEnd,
                                        newPeriodStart: claim.newPeriodStart,
                                        newPeriodEnd: claim.newPeriodEnd,
                                        extraFee: claim.extraFee,
                                        extraFeeName: claim.extraFeeName,
                                        extraPersonFee: claim.extraFee,
                                        basePrice: Number(claim.monthlyPrice || claimProp.price || 0) - Number(claim.extraFee || 0),
                                        paketSewa: 1
                                    }
                                };
                                setResidentStatus([claimedItem]);
                                setActiveKosts([claimedItem]);
                            } else {
                                setResidentStatus([]);
                                setActiveKosts([]);
                            }
                        } else {
                            setResidentStatus([]);
                            setActiveKosts([]);
                        }
                    } catch {
                        setResidentStatus([]);
                        setActiveKosts([]);
                    }
                } else {
                    setResidentStatus([]);
                    setActiveKosts([]);
                }
            }

            // Recommendations
            const { data: recData } = await supabase.from('properties').select('id, title, price, city, image_urls, type, rating').eq('status', 'published').limit(3);
            const processedRecs = (recData || []).map(prop => {
                const rawImages = prop.image_urls || [];
                let firstImage = 'https://via.placeholder.com/400x300';
                if (rawImages.length > 0) {
                    const img = rawImages[0];
                    const path = typeof img === 'string' ? img : (img.original || img.webp || '');
                    if (path) firstImage = path.startsWith('http') ? path : supabase.storage.from('properties').getPublicUrl(path).data.publicUrl;
                }
                return { ...prop, displayImage: firstImage };
            });
            // Fetch surveys with agent details join
            const { data: surveysData, error: surveysError } = await supabase
                .from('survey_requests')
                .select(`
                    *,
                    agent:assigned_agent_id (
                        name,
                        phone,
                        photo_url
                    )
                `)
                .eq('user_id', user.uid);

            console.log("DEBUG_MYKOST: Raw surveysData from DB:", surveysData, "Error:", surveysError);
            if (surveysError) {
                console.error('fetchSurveys error:', surveysError);
            } else {
                // Map the joined data to ensure fallback if snapshot is empty
                const processedSurveys = (surveysData || []).map((s: any) => ({
                    ...s,
                    agent_name: s.agent_name || s.agent?.name,
                    agent_phone: s.agent_phone || s.agent?.phone,
                    agent_photo_url: s.agent_photo_url || s.agent?.photo_url
                }));
                console.log("DEBUG_MYKOST: processedSurveys set to state:", processedSurveys);
                setSurveyRequests(processedSurveys);
            }

            setRecommendations(processedRecs);
            // Disable independent extra bills section on main page to prevent "zombie" bill leaks.
            // All valid bills are now handled inside each kost's detail modal.
            setExtraBills([]);
        } catch (error) {
            console.error('Error fetching my kosts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStartPayment = (amount: number, prodId: string, prodType: any, metadata: any, existingId?: string) => {
        setPaymentAmount(amount);
        setPaymentProductId(prodId);
        setPaymentProductType(prodType);
        setPaymentMetadata(metadata);
        setPaymentOrderId(existingId || `${prodType.toUpperCase()}-${Date.now()}`);
        setShowPaymentGateway(true);
        setShowExtensionModal(false);
        setShowExtraBillModal(false);
    };

    const handleOpenExtension = (kost: any) => {
        setSelectedKost(kost);
        setExtensionPeriod(1);
        setExtensionTab('form');
        setShowExtensionModal(true);
        setShowExtraBillModal(false);
    };

    const handleOpenBill = (kost: any) => {
        setSelectedKost(kost);
        setShowExtraBillModal(true);
        setShowExtensionModal(false);
    };

    const handleOpenComplaint = (kost: any) => {
        setSelectedKost(kost);
        setComplaintTitle('');
        setComplaintDesc('');
        setComplaintCategory('AC & Ventilasi');
        setComplaintUrgency('NORMAL');
        setComplaintPhoto(null);
        setComplaintPhotoPreview('');
        setShowComplaintModal(true);
        setShowExtraBillModal(false);
        setShowExtensionModal(false);
    };

    const handleOpenRating = (kost: any) => {
        setSelectedKost(kost);
        setShowRatingModal(true);
        setShowExtraBillModal(false);
        setShowExtensionModal(false);
    };

    const submitRating = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedKost) return;
        setIsSubmitting(true);
        try {
            await addPropertyReview(selectedKost.kostId, {
                userId: user.uid,
                userName: user.name || user.displayName || 'Penyewa',
                rating: ratingValue,
                comment: ratingComment
            });
            alert('Terima kasih! Penilaian Anda telah disimpan.');
            setShowRatingModal(false);
            setRatingValue(5);
            setRatingComment('');
        } catch (err) {
            console.error(err);
            alert('Gagal menyimpan penilaian.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const submitExtension = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!extensionProof || !selectedKost) return;
        setIsSubmitting(true);
        try {
            // Upload proof ke Supabase Storage (bucket: receipts)
            const fileExt = extensionProof.name.split('.').pop();
            const fileName = `${user.uid}/${Date.now()}_ext.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('receipts')
                .upload(fileName, extensionProof);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('receipts')
                .getPublicUrl(fileName);

            // Create extension transaction
            const basePrice = selectedKost.totalPrice / (selectedKost.duration || 1); // rough estimate of monthly base
            const extPrice = basePrice * extensionPeriod;

            const payload = {
                type: 'perpanjangan_sewa',
                product_id: selectedKost.kostId,
                kost_name: selectedKost.kostName,
                tenant_name: user.name || user.displayName || 'Penyewa',
                user_id: user.uid,
                user_email: user.email,
                duration: extensionPeriod,
                period: 'bulanan', // assume monthly extensions for now
                room_type: selectedKost.roomType || '-',
                total_price: extPrice,
                receipt_url: publicUrl,
                status: 'pending',
                original_transaction_id: selectedKost.id
            };

            const { error: dbError } = await supabase.from('transactions').insert([payload]);
            if (dbError) throw dbError;

            notifyAdminTransaction("Perpanjangan Sewa Kost", {
                "Nama Penyewa": payload.tenant_name,
                "Nama Kost": payload.kost_name,
                "Durasi": payload.duration,
                "Total Bayar": `Rp ${payload.total_price.toLocaleString('id-ID')}`
            });

            alert('Pengajuan perpanjangan sewa berhasil dikirim dan menunggu verifikasi Admin.');
            setShowExtensionModal(false);
            setExtensionProof(null);
        } catch (err) {
            console.error(err);
            alert('Terjadi kesalahan saat mengunggah.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const submitExtraBill = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!billProof || !selectedKost || !billName || !billAmount) return;
        setIsSubmitting(true);
        try {
            const fileExt = billProof.name.split('.').pop();
            const fileName = `${user.uid}/${Date.now()}_bill.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('receipts')
                .upload(fileName, billProof);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('receipts')
                .getPublicUrl(fileName);

            const payload = {
                type: 'tagihan_ekstra',
                product_id: selectedKost.kostId,
                kost_name: selectedKost.kostName,
                user_id: user.uid,
                tenant_name: user.name || user.displayName || 'Penyewa',
                bill_name: billName,
                total_price: parseInt(billAmount.replace(/\D/g, '') || '0'),
                receipt_url: publicUrl,
                status: 'pending',
                original_transaction_id: selectedKost.id
            };

            const { error: dbError } = await supabase.from('transactions').insert([payload]);
            if (dbError) throw dbError;

            notifyAdminTransaction("Pembayaran Tagihan Ekstra", {
                "Nama Penyewa": payload.tenant_name,
                "Nama Kost": payload.kost_name,
                "Tagihan": payload.bill_name,
                "Total Harga": `Rp ${payload.total_price.toLocaleString('id-ID')}`
            });

            alert('Pembayaran tagihan ekstra berhasil dikirim dan menunggu verifikasi.');
            setShowExtraBillModal(false);
            setBillProof(null);
            setBillName('');
            setBillAmount('');
        } catch (err) {
            console.error(err);
            alert('Terjadi kesalahan saat memproses tagihan.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const submitComplaint = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedKost || !complaintTitle.trim() || !complaintDesc.trim()) {
            alert('Mohon lengkapi judul dan rincian kendala.');
            return;
        }
        setIsSubmitting(true);

        let photoUrl = '';
        try {
            if (complaintPhoto) {
                // Rule #5: Compress to WebP before upload
                const webpFile = await compressImageToWebP(complaintPhoto, 0.82, 1920);
                const fileName = `${user.uid}/${Date.now()}_complaint_${Math.random().toString(36).substring(2, 7)}.webp`;

                let { error: uploadError } = await supabase.storage
                    .from('complaints')
                    .upload(fileName, webpFile, {
                        contentType: 'image/webp',
                        upsert: true
                    });

                if (uploadError) {
                    console.warn('[Storage complaints error, fallback to documents]', uploadError);
                    const { error: fallbackErr } = await supabase.storage
                        .from('documents')
                        .upload(`complaints/${fileName}`, webpFile, {
                            contentType: 'image/webp',
                            upsert: true
                        });
                    if (fallbackErr) {
                        console.error('[Storage fallback error]', fallbackErr);
                    } else {
                        const { data: { publicUrl } } = supabase.storage
                            .from('documents')
                            .getPublicUrl(`complaints/${fileName}`);
                        photoUrl = publicUrl;
                    }
                } else {
                    const { data: { publicUrl } } = supabase.storage
                        .from('complaints')
                        .getPublicUrl(fileName);
                    photoUrl = publicUrl;
                }
            }

            const { error: dbError } = await supabase.from('complaints').insert([{
                kost_id: selectedKost.kostId || selectedKost.id,
                kost_name: selectedKost.kostName || selectedKost.name || 'Properti Kost',
                room_number: selectedKost.roomNumber || selectedKost.room_number || selectedKost.roomType || '-',
                user_id: user.uid,
                user_name: user.name || user.displayName || 'Penyewa',
                user_phone: user.phone || user.phoneNumber || '-',
                category: complaintCategory,
                urgency: complaintUrgency,
                title: complaintTitle.trim(),
                description: complaintDesc.trim(),
                photo_url: photoUrl,
                status: 'open',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }]);

            if (dbError) throw dbError;

            alert('Laporan kendala berhasil dikirim! Pengelola kost dan tim teknis akan segera menindaklanjuti.');
            setShowComplaintModal(false);
            setComplaintPhoto(null);
            setComplaintPhotoPreview('');
            setComplaintTitle('');
            setComplaintDesc('');
            setComplaintCategory('AC & Ventilasi');
            setComplaintUrgency('NORMAL');
        } catch (err: any) {
            console.error('[submitComplaint Error]', err);
            alert(`Terjadi kesalahan saat mengirim komplain: ${err.message || 'Silakan coba lagi.'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleConfirmSurvey = (surveyId: string) => {
        const survey = surveyRequests.find(s => s.id === surveyId);
        if (survey) {
            setSelectedRatingSurvey(survey);
            setSurveyRatingValue(5);
            setSurveyRatingComment('');
            setShowSurveyRatingModal(true);
        }
    };

    const submitSurveyRating = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRatingSurvey) return;
        setIsSubmitting(true);
        try {
            const { error } = await supabase
                .from('survey_requests')
                .update({ 
                    status: 'COMPLETED', 
                    user_rating: surveyRatingValue,
                    user_comment: surveyRatingComment,
                    updated_at: new Date().toISOString() 
                })
                .eq('id', selectedRatingSurvey.id);

            if (error) throw error;

            alert('Survey berhasil dikonfirmasi! Terima kasih atas ulasan Anda.');
            setShowSurveyRatingModal(false);
            
            // Refresh surveys
            const { data } = await supabase
                .from('survey_requests')
                .select(`
                    *,
                    agent:assigned_agent_id (
                        name,
                        phone,
                        photo_url
                    )
                `)
                .eq('user_id', user.uid);
            
            if (data) {
                const processedSurveys = data.map((s: any) => ({
                    ...s,
                    agent_name: s.agent_name || s.agent?.name,
                    agent_phone: s.agent_phone || s.agent?.phone,
                    agent_photo_url: s.agent_photo_url || s.agent?.photo_url
                }));
                setSurveyRequests(processedSurveys);
            }
        } catch (err) {
            console.error(err);
            alert('Gagal mengonfirmasi survey.');
        } finally {
            setIsSubmitting(false);
        }
    };




    const STATUS_COLOR: any = {
        'AWAITING_PAYMENT': 'bg-orange-50 text-orange-600 border-orange-100',
        'PENDING_ASSIGNMENT': 'bg-amber-50 text-amber-600 border-amber-100',
        'AGENT_ASSIGNED': 'bg-blue-50 text-blue-600 border-blue-100',
        'HEADING_TO_LOCATION': 'bg-indigo-50 text-indigo-600 border-indigo-100',
        'SURVEYING': 'bg-cyan-50 text-cyan-600 border-cyan-100',
        'SUBMITTED': 'bg-emerald-50 text-emerald-600 border-emerald-100',
        'COMPLETED': 'bg-green-50 text-green-600 border-green-100',
        'EXPIRED': 'bg-rose-50 text-rose-600 border-rose-100',
        'CANCELLED': 'bg-gray-50 text-gray-400 border-gray-100'
    };
    const STATUS_LABEL: any = {
        'AWAITING_PAYMENT': 'Menunggu Pembayaran',
        'PENDING_ASSIGNMENT': 'Mencari Agen',
        'AGENT_ASSIGNED': 'Agen Ditetapkan',
        'HEADING_TO_LOCATION': 'Menuju Lokasi',
        'SURVEYING': 'Sedang Survey',
        'SUBMITTED': 'Laporan Terkirim ✓',
        'COMPLETED': 'Survey Selesai ✓',
        'EXPIRED': 'Hangus (Waktu Habis)',
        'CANCELLED': 'Dibatalkan'
    };

    // Render 1 ORDER card yang berisi N kost (grouped by transaction_id)
    const renderSurveyOrderCard = (surveys: any[]) => {
        const first = surveys[0];
        const transactionId = first.transaction_id || first.id;
        const totalKost = surveys.length;
        const doneKosts = surveys.filter(s => ['SUBMITTED', 'COMPLETED'].includes(s.status)).length;
        const allDone = surveys.every(s => s.status === 'COMPLETED');
        const orderStatus = allDone ? 'COMPLETED' : surveys.some(s => ['SURVEYING', 'HEADING_TO_LOCATION'].includes(s.status)) ? 'SURVEYING' : first.status;
        const isKostManager = first.notes?.toLowerCase().includes('kostmanager') || first.notes?.toLowerCase().includes('kost manager');

        return (
            <div key={transactionId} className="group relative bg-white rounded-[2.5rem] p-6 sm:p-8 border border-gray-100 shadow-xl shadow-gray-200/40 hover:shadow-2xl transition-all duration-500 overflow-hidden">
                {/* Accent */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-orange-500/5 to-transparent rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none" />

                {/* Header Order */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-orange-50 rounded-[1.5rem] flex items-center justify-center border border-orange-100/50 shrink-0">
                            {isKostManager ? <Zap className="w-8 h-8 text-orange-500 animate-pulse" /> : <Search className="w-8 h-8 text-orange-500" />}
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-orange-500 uppercase tracking-[0.2em] mb-1">{isKostManager ? 'Layanan Premium KostManager Auto-Pilot' : 'Jasa Survey Lokasi Kost'}</p>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border flex items-center gap-1.5 ${STATUS_COLOR[orderStatus] || 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                                    {STATUS_LABEL[orderStatus] || orderStatus}
                                </span>
                                <span className="px-3 py-1 rounded-full text-[9px] font-black bg-gray-100 text-gray-600 border border-gray-200">
                                    {isKostManager ? 'Survey Pendataan Kost' : `${doneKosts}/${totalKost} kost selesai`}
                                </span>
                            </div>
                        </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="sm:w-48 w-full">
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-700"
                                style={{ width: `${totalKost > 0 ? (doneKosts / totalKost) * 100 : 0}%` }}
                            />
                        </div>
                        <p className="text-[9px] font-bold text-gray-400 mt-1 text-right">{Math.round(totalKost > 0 ? (doneKosts / totalKost) * 100 : 0)}% Selesai</p>
                    </div>
                </div>

                {/* Agent Info (shared, from first survey yang punya agen) */}
                {(() => {
                    const surveyWithAgent = surveys.find(s => s.agent_name);
                    if (!surveyWithAgent) return null;
                    return (
                        <div className="mb-5 px-4 py-3 bg-blue-50/60 rounded-2xl border border-blue-100 flex items-center gap-3">
                            <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center overflow-hidden shrink-0 border border-blue-100 shadow-sm">
                                {surveyWithAgent.agent_photo_url
                                    ? <img src={surveyWithAgent.agent_photo_url} alt={surveyWithAgent.agent_name} className="w-full h-full object-cover" />
                                    : <span className="text-sm font-black text-blue-400">{surveyWithAgent.agent_name?.charAt(0)}</span>
                                }
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Petugas Lapangan</p>
                                <p className="text-sm font-black text-gray-900 truncate">{surveyWithAgent.agent_name}</p>
                            </div>
                            {surveyWithAgent.agent_phone && (
                                <button
                                    onClick={() => {
                                        const clean = surveyWithAgent.agent_phone.replace(/\D/g, '');
                                        const num = clean.startsWith('0') ? '62' + clean.substring(1) : clean;
                                        window.open(`https://wa.me/${num}`, '_blank');
                                    }}
                                    className="p-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-200 shrink-0"
                                    title="Chat Agen"
                                >
                                    <MessageSquare className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    );
                })()}

                {/* Jadwal */}
                {(first.survey_date || first.survey_time) && (
                    <div className="mb-5 flex items-center gap-3 text-xs font-bold text-gray-500">
                        <div className="p-2 bg-gray-50 rounded-xl"><Calendar className="w-3.5 h-3.5 text-gray-400" /></div>
                        <span className="italic">Jadwal: {first.survey_date ? new Date(first.survey_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '-'} @ {first.survey_time || '-'}</span>
                    </div>
                )}

                {/* Daftar Kost */}
                <div className="space-y-3">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Daftar Kost yang Disurvey</p>
                    {surveys.map((survey, idx) => {
                        const sColor = STATUS_COLOR[survey.status] || 'bg-gray-50 text-gray-500 border-gray-100';
                        const sLabel = STATUS_LABEL[survey.status] || survey.status;
                        const isDone = survey.status === 'COMPLETED';
                        const isSubmitted = survey.status === 'SUBMITTED';
                        const isActive = ['AGENT_ASSIGNED', 'HEADING_TO_LOCATION', 'SURVEYING'].includes(survey.status);

                        return (
                            <div key={survey.id} className={`rounded-2xl border p-4 transition-all duration-300 ${isDone ? 'bg-green-50/50 border-green-100' : isSubmitted ? 'bg-emerald-50/50 border-emerald-100' : 'bg-gray-50/50 border-gray-100'}`}>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                    {/* Nomor & Nama */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${isDone ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                                                {isDone ? '✓' : idx + 1}
                                            </div>
                                            <p className="font-black text-gray-900 text-sm truncate">{survey.kost_name || `Kost #${idx + 1}`}</p>
                                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black border shrink-0 ${sColor}`}>{sLabel}</span>
                                        </div>
                                        <div className="flex flex-col gap-1 ml-8">
                                            {survey.kost_address && survey.kost_address !== '-' && (
                                                <div className="flex items-center gap-2 text-[10px] text-gray-500 font-medium">
                                                    <MapPin className="w-3 h-3 text-gray-300 shrink-0" />
                                                    <span className="truncate">{survey.kost_address}</span>
                                                </div>
                                            )}
                                            {survey.owner_phone && survey.owner_phone !== '-' && (
                                                <div className="flex items-center gap-2">
                                                    <Smartphone className="w-3 h-3 text-gray-300 shrink-0" />
                                                    <a href={`https://wa.me/${survey.owner_phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
                                                        className="text-[10px] text-emerald-600 font-bold hover:underline">
                                                        {survey.owner_phone}
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action per kost */}
                                    <div className="flex items-center gap-2 ml-8 sm:ml-0 shrink-0">
                                        {isSubmitted && (
                                            <button
                                                onClick={() => handleConfirmSurvey(survey.id)}
                                                disabled={isSubmitting}
                                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-[10px] uppercase tracking-wider transition-all shadow-lg shadow-emerald-200 active:scale-95 flex items-center gap-1.5 animate-subtle-bounce"
                                            >
                                                <CheckCircle className="w-3.5 h-3.5" /> Konfirmasi
                                            </button>
                                        )}
                                        {isDone && survey.evaluation_summary && (
                                            <button
                                                onClick={() => {
                                                    let parsed = survey.evaluation_summary;
                                                    if (typeof parsed === 'string') { try { try { parsed = JSON.parse(parsed); } catch { parsed = {}; } } catch { parsed = {}; } }
                                                    setSelectedSurvey({ ...survey, evaluation_summary: parsed });
                                                    setShowSurveySummaryModal(true);
                                                }}
                                                className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-black text-[10px] uppercase tracking-wider transition-all shadow-lg active:scale-95 flex items-center gap-1.5"
                                            >
                                                <FileText className="w-3.5 h-3.5 text-orange-400" /> Laporan
                                            </button>
                                        )}
                                        {survey.status !== 'CANCELLED' && (
                                            <button
                                                onClick={() => {
                                                    setSelectedTrackingSurvey(survey);
                                                    setShowTrackingModal(true);
                                                }}
                                                className="px-3 py-2 bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200/40 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all flex items-center gap-1.5 active:scale-95 shadow-sm"
                                            >
                                                <Activity className="w-3.5 h-3.5 text-orange-500 animate-pulse" /> Lacak
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Pesan standby jika ada kost aktif */}
                {surveys.some(s => ['AGENT_ASSIGNED', 'HEADING_TO_LOCATION', 'SURVEYING'].includes(s.status)) && (
                    <div className="mt-4 flex items-start gap-3 p-3 px-4 bg-orange-50/50 rounded-2xl border border-orange-100/50">
                        <AlertCircle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                        <p className="text-[10px] font-bold text-gray-600 leading-relaxed">
                            Mohon standby! Agen kami mungkin akan menghubungi Anda via WhatsApp untuk verifikasi lokasi secara langsung.
                        </p>
                    </div>
                )}

                {/* Order Completed Banner */}
                {allDone && (
                    <div className="mt-4 p-4 bg-green-50 rounded-2xl border border-green-100 text-center">
                        <p className="text-xs font-black text-green-600 uppercase tracking-wider">🎉 Semua Kost Telah Disurvey — Order 100% Selesai!</p>
                    </div>
                )}
            </div>
        );
    };

    // Legacy single-kost card (untuk backward compat order lama)
    const renderSurveyCard = (survey: any) => renderSurveyOrderCard([survey]);





    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 pt-28 pb-12">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-4 mb-10">
                        <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse" />
                        <div className="space-y-2">
                            <div className="h-8 bg-gray-200 rounded-md w-48 animate-pulse" />
                            <div className="h-4 bg-gray-200 rounded-md w-32 animate-pulse" />
                        </div>
                    </div>
                    <SkeletonLoader />
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center pt-24 sm:pt-32 pb-12 p-4">
                <div className="max-w-md w-full bg-white rounded-[3.5rem] p-12 text-center shadow-2xl shadow-orange-900/5 border border-gray-50 flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="relative mb-10">
                        <div className="w-32 h-32 bg-orange-50 rounded-full flex items-center justify-center animate-pulse">
                            <Plus className="w-12 h-12 text-orange-200" />
                        </div>
                        <div className="absolute top-0 right-0 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center border border-gray-50">
                            <Search className="w-6 h-6 text-orange-500" />
                        </div>
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight mb-4 leading-tight">Mulai Kelola <br /> Kost Kamu</h2>
                    <p className="text-gray-500 font-medium mb-10 leading-relaxed">Informasi booking dan survey hanya tersedia untuk pengguna yang telah masuk.</p>
                    <button
                        onClick={() => navigate(Page.LOGIN)}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl shadow-orange-200 transition-all active:scale-95 flex items-center justify-center gap-3"
                    >
                        MASUK / DAFTAR
                        <ChevronRight className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => navigate(Page.HOME)}
                        className="mt-6 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-orange-500 transition-colors"
                    >
                        Kembali ke Beranda
                    </button>
                </div>
            </div>
        );
    }

    const filteredKosts = activeTab === 'aktif' ? residentStatus : activeKosts.filter(kost => {
        const s = (kost.status || '').toUpperCase();
        const expiryInfo = getBookingExpiryInfo(kost);
        const isExpired = expiryInfo.isExpired || s === 'EXPIRED';
        const isPaid = ['APPROVED', 'PAID', 'SELESAI', 'SUCCESS', 'BERHASIL'].includes(s);
        const isPending = ['PENDING_APPROVAL', 'AWAITING_PAYMENT', 'PENDING'].includes(s);

        if (activeTab === 'diajukan') {
            if (isExpired) return false;
            return isPending;
        }

        if (activeTab === 'riwayat') {
            if (isExpired || s === 'EXPIRED' || s === 'REJECTED' || s === 'CANCELLED' || s === 'CHECKED_OUT' || s === 'COMPLETED' || kost.is_checked_out) return true;
            if (!isPaid) return false;
            if (!kost.endDate) return false;
            const eDate = new Date(kost.endDate);
            if (isNaN(eDate.getTime())) return false;
            return getCurrentDate() > eDate;
        }
        return false;
    }).sort((a, b) => {
        const statusOrder: Record<string, number> = {
            'AWAITING_PAYMENT': 1,
            'PENDING_APPROVAL': 2,
            'PENDING': 2,
            'EXPIRED': 3,
            'REJECTED': 4,
            'CANCELLED': 5
        };
        const sA = (a.status || '').toUpperCase();
        const sB = (b.status || '').toUpperCase();
        return (statusOrder[sA] || 99) - (statusOrder[sB] || 99);
    });

    const groupedSurveyOrders = Object.values(surveyRequests.reduce((acc, s) => {
        const key = s.transaction_id || s.id;
        if (!acc[key]) acc[key] = [];
        acc[key].push(s);
        return acc;
    }, {} as Record<string, any[]>));

    const surveyOrdersTabMap = { diajukan: 0, aktif: 0, riwayat: 0 };
    const filteredSurveyOrders = groupedSurveyOrders.filter(group => {
        const allCompletedOrCancelled = group.every(s => ['COMPLETED', 'CANCELLED'].includes(s.status));
        const anyActive = group.some(s => ['AGENT_ASSIGNED', 'HEADING_TO_LOCATION', 'SURVEYING', 'SUBMITTED'].includes(s.status));
        
        let tab = 'diajukan';
        if (allCompletedOrCancelled) {
            tab = 'riwayat';
        } else if (anyActive || group.some(s => s.status === 'COMPLETED')) {
            tab = 'aktif';
        }
        
        surveyOrdersTabMap[tab as keyof typeof surveyOrdersTabMap]++;
        return activeTab === tab;
    });

    console.log("DEBUG_MYKOST_RENDER: surveyRequests state:", surveyRequests);
    console.log("DEBUG_MYKOST_RENDER: groupedSurveyOrders:", groupedSurveyOrders);
    console.log("DEBUG_MYKOST_RENDER: filteredSurveyOrders:", filteredSurveyOrders);
    console.log("DEBUG_MYKOST_RENDER: surveyOrdersTabMap:", surveyOrdersTabMap);
    console.log("DEBUG_MYKOST_RENDER: activeTab:", activeTab);

    return (
        <div className="min-h-screen bg-[#F8FAFC] pt-8 pb-12 font-outfitSelection">
            {/* Background Decorations */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-orange-100/30 rounded-full blur-[120px]" />
                <div className="absolute top-[20%] -left-[10%] w-[30%] h-[30%] bg-blue-100/20 rounded-full blur-[100px]" />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                    <div>
                        <div className="flex items-center gap-4 mb-4">
                            <button
                                onClick={() => navigate(Page.HOME)}
                                className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100 hover:bg-orange-50 hover:border-orange-200 transition-all active:scale-95 group"
                            >
                                <ArrowLeft className="w-5 h-5 text-gray-400 group-hover:text-orange-500" />
                            </button>
                            <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight">Kost Saya</h1>
                        </div>
                        <p className="flex items-center gap-2 text-gray-500 font-bold ml-16 md:ml-0">
                            <span className="text-sm">⚡</span>
                            Kelola hunian aktif Anda dengan mudah
                        </p>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="bg-gray-100/50 p-1 sm:p-1.5 rounded-2xl sm:rounded-[2rem] flex items-center justify-center gap-1 w-full sm:w-auto self-stretch sm:self-auto border border-gray-100/80 backdrop-blur-sm">
                        {[
                            {
                                id: 'diajukan', label: 'Diajukan', count: activeKosts.filter(k => {
                                    const s = (k.status || '').toUpperCase();
                                    const expiryInfo = getBookingExpiryInfo(k);
                                    if (expiryInfo.isExpired || s === 'EXPIRED') return false;
                                    return ['PENDING_APPROVAL', 'AWAITING_PAYMENT', 'PENDING'].includes(s);
                                }).length + surveyOrdersTabMap.diajukan
                            },
                            { id: 'aktif', label: 'Aktif', count: residentStatus.length + surveyOrdersTabMap.aktif },
                            { 
                                id: 'riwayat', 
                                label: 'Riwayat', 
                                count: activeKosts.filter(k => {
                                    const s = (k.status || '').toUpperCase();
                                    const expiryInfo = getBookingExpiryInfo(k);
                                    if (expiryInfo.isExpired || s === 'EXPIRED') return true;
                                    const isPaid = ['APPROVED', 'PAID', 'SELESAI', 'SUCCESS', 'BERHASIL'].includes(s);
                                    if (s === 'REJECTED' || s === 'CANCELLED' || s === 'CHECKED_OUT' || s === 'COMPLETED' || k.is_checked_out) return true;
                                    if (!isPaid || !k.endDate) return false;
                                    const eDate = new Date(k.endDate);
                                    return !isNaN(eDate.getTime()) && getCurrentDate() > eDate;
                                }).length + surveyOrdersTabMap.riwayat 
                            }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => handleTabChange(tab.id as any)}
                                className={`px-3 sm:px-6 py-2.5 sm:py-3.5 rounded-xl sm:rounded-[1.5rem] text-[10px] sm:text-[11px] font-black uppercase tracking-[0.08em] sm:tracking-[0.15em] transition-all duration-300 flex items-center justify-center gap-1.5 sm:gap-2.5 flex-1 sm:flex-initial ${activeTab === tab.id
                                    ? 'bg-white text-orange-500 shadow-xl shadow-orange-100/50 border border-orange-100'
                                    : 'text-gray-400 hover:text-gray-600 hover:bg-white/50'
                                    }`}
                            >
                                {tab.label}
                                {tab.count > 0 && (
                                    <span className={`w-4 h-4 sm:w-5 sm:h-5 rounded-md sm:rounded-lg flex items-center justify-center text-[8px] sm:text-[9px] ${activeTab === tab.id ? 'bg-orange-100 text-orange-600' : 'bg-gray-200 text-gray-500'}`}>
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {extraBills.length > 0 && (
                    <div className="mb-12 animate-in fade-in slide-in-from-top-6 duration-700">
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-orange-100 rounded-lg">
                                    <Receipt className="w-5 h-5 text-orange-600" />
                                </div>
                                <h2 className="text-xl font-black text-gray-900">Tagihan Menunggu</h2>
                            </div>
                            <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-[10px] font-black uppercase">{extraBills.length} Tagihan</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {extraBills.map(bill => (
                                <div key={bill.id} className="group bg-white p-6 rounded-[2rem] border border-orange-100 shadow-xl shadow-orange-900/5 flex items-center justify-between hover:scale-[1.02] transition-transform duration-300">
                                    <div>
                                        <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">{bill.bill_name || 'Tagihan Ekstra'}</p>
                                        <p className="text-2xl font-black text-gray-900 mt-1">
                                            {FORMAT_CURRENCY(bill.amount || 0)}
                                        </p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                                            <p className="text-[11px] text-gray-500 font-bold">Menunggu Pembayaran</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleOpenBill({ ...bill, kostName: bill.kost_name, kostId: bill.product_id })}
                                        className="bg-gray-900 hover:bg-orange-600 text-white px-6 py-3 rounded-2xl text-xs font-black transition-all shadow-lg active:scale-95"
                                    >
                                        BAYAR
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {(filteredKosts.length > 0 || filteredSurveyOrders.length > 0) ? (
                    <div className="space-y-6 sm:space-y-8">
                        {/* Render Surveys: 1 order card per transaction_id */}
                        {filteredSurveyOrders.map(group => renderSurveyOrderCard(group))}

                        {filteredKosts.map((kost) => {
                            const statusLower = (kost.status || '').toLowerCase();
                            const isPaid = ['approved', 'paid', 'selesai', 'success', 'berhasil', 'active'].includes(statusLower);
                            if (statusLower === 'rejected') {
                                return (
                                    <div key={kost.id} className="bg-white rounded-[2.5rem] p-6 sm:p-8 border border-red-50 shadow-xl shadow-red-900/5 animate-in slide-in-from-bottom-4 duration-500">
                                        <div className="flex items-center gap-6 sm:gap-8">
                                            {/* Minimalist Preview */}
                                            <div className="w-20 h-20 sm:w-28 sm:h-28 bg-gray-50 rounded-2xl overflow-hidden shadow-sm shrink-0">
                                                {kost.displayImage ? (
                                                    <img src={kost.displayImage} className="w-full h-full object-cover opacity-60 grayscale-[50%]" alt={kost.kostName} />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                                        <MapPin className="w-8 h-8 text-gray-300" />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0 flex flex-col gap-2">
                                                <div className="flex flex-wrap items-center gap-3">
                                                    <h3 className="text-xl sm:text-2xl font-black text-gray-400 uppercase tracking-tight truncate">{kost.kostName || 'Kost Tersembunyi'}</h3>
                                                    <span className="flex items-center gap-1.5 text-red-400 bg-red-50/50 px-3 py-1 rounded-full border border-red-100/50 text-[9px] font-black uppercase tracking-widest">
                                                        <XCircle className="w-3.5 h-3.5" /> DITOLAK PEMILIK
                                                    </span>
                                                </div>

                                                {kost.rejection_reason && (
                                                    <div className="flex items-start gap-2 mt-1">
                                                        <AlertCircle className="w-4 h-4 text-red-200 shrink-0 mt-0.5" />
                                                        <p className="text-xs font-medium text-gray-400 leading-relaxed italic">
                                                            "{kost.rejection_reason}"
                                                        </p>
                                                    </div>
                                                )}

                                                <button
                                                    onClick={() => navigate(`${Page.DETAIL}?kostId=${kost.kostId}`)}
                                                    className="w-fit text-[9px] font-black text-orange-500 hover:text-orange-600 uppercase tracking-widest flex items-center gap-1 mt-1 transition-colors"
                                                >
                                                    <Search className="w-3 h-3" /> CARI KOST LAIN
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }

                            const kMeta = kost.metadata || {};

                            // Lease progress bar calculation
                            const startDateObj = parseDateSafely(kost.moveInDate || kMeta.startDate);
                            const endDateObj = parseDateSafely(kost.endDate || kMeta.endDate);
                            const nowObj = getCurrentDate();

                            let totalLeaseDays = 30;
                            let daysElapsed = 0;
                            let progressPercent = 0;

                            if (startDateObj && endDateObj) {
                                const totalMs = endDateObj.getTime() - startDateObj.getTime();
                                totalLeaseDays = Math.max(1, Math.round(totalMs / (1000 * 60 * 60 * 24)));
                                const elapsedMs = Math.max(0, nowObj.getTime() - startDateObj.getTime());
                                daysElapsed = Math.min(totalLeaseDays, Math.round(elapsedMs / (1000 * 60 * 60 * 24)));
                                progressPercent = Math.min(100, Math.max(0, Math.round((daysElapsed / totalLeaseDays) * 100)));
                            }
                            const heroImage = (kost.roomPhotos && kost.roomPhotos[0]) 
                                || kost.displayImage 
                                || (kost.image_urls && (typeof kost.image_urls[0] === 'string' ? kost.image_urls[0] : kost.image_urls[0]?.url)) 
                                || (kost.images && kost.images[0]) 
                                || kost.image 
                                || (kost.properties?.image_urls && (typeof kost.properties.image_urls[0] === 'string' ? kost.properties.image_urls[0] : kost.properties.image_urls[0]?.url))
                                || (kost.properties?.images && kost.properties.images[0])
                                || '';

                            const roomPhotoList = (kost.roomPhotos && kost.roomPhotos.length > 0)
                                ? kost.roomPhotos
                                : (heroImage ? [heroImage] : []);

                            const expiry = getBookingExpiryInfo(kost);
                            const isExpiredBooking = expiry.isExpired || (kost.status || '').toUpperCase() === 'EXPIRED';
                            const isAwaitingPayment = (kost.status || '').toUpperCase() === 'AWAITING_PAYMENT' && !isExpiredBooking;

                            return (
                                <div key={kost.id} className="group relative bg-white rounded-3xl sm:rounded-[3rem] p-5 sm:p-8 lg:p-10 border border-gray-100 shadow-xl shadow-gray-200/50 hover:shadow-2xl hover:shadow-orange-900/10 transition-all duration-500 overflow-hidden flex flex-col gap-6 sm:gap-8">
                                    {/* Accent Background Glow */}
                                    <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-transparent rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />

                                    {/* Top Section: Main Content + Sidebar Actions */}
                                    <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 sm:gap-8 items-start">
                                        {/* Left / Main Column */}
                                        <div className="lg:col-span-8 flex flex-col gap-5 sm:gap-6 w-full">
                                            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-7 text-center sm:text-left">
                                                {/* Interactive Image Container */}
                                                <div 
                                                    onClick={() => heroImage && handleOpenGallery(roomPhotoList, kost.kostName || 'Kamar Kost')}
                                                    className="relative shrink-0 group/img cursor-pointer"
                                                    title="Klik untuk melihat foto kamar & hunian"
                                                >
                                                    <div className="w-48 h-36 sm:w-56 sm:h-44 bg-slate-900 rounded-2xl sm:rounded-[2rem] flex items-center justify-center shadow-xl shadow-orange-100/70 border-2 border-white transform hover:scale-[1.02] transition-all duration-500 overflow-hidden relative">
                                                        {heroImage ? (
                                                            <img 
                                                                src={heroImage} 
                                                                className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-700" 
                                                                alt={kost.kostName} 
                                                            />
                                                        ) : (
                                                            <div className="flex flex-col items-center justify-center gap-1.5 p-4 text-center">
                                                                <Building className="w-10 h-10 text-orange-300/80" />
                                                                <span className="text-[10px] font-bold text-slate-300">RuangSinggah</span>
                                                            </div>
                                                        )}
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80 group-hover/img:opacity-100 transition-opacity" />
                                                        
                                                        {/* Photo Count Overlay Badge */}
                                                        <div className="absolute bottom-2.5 left-2.5 sm:bottom-3 sm:left-3 bg-black/60 backdrop-blur-md text-white text-[9px] sm:text-[10px] font-bold px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full flex items-center gap-1.5 border border-white/20">
                                                            <Camera className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-orange-400" />
                                                            <span>{roomPhotoList.length > 0 ? `${roomPhotoList.length} Foto` : 'Kost'}</span>
                                                        </div>
                                                    </div>
                                                    <div className="absolute -bottom-2 -right-2 w-9 h-9 sm:w-11 sm:h-11 bg-white rounded-xl sm:rounded-2xl shadow-lg flex items-center justify-center border-2 border-orange-50 z-20">
                                                        <span className="text-base sm:text-xl">⚡</span>
                                                    </div>
                                                </div>

                                                {/* Property & Room Header Info */}
                                                <div className="flex-1 w-full min-w-0">
                                                    {/* Badges Bar */}
                                                    <div className="flex flex-wrap justify-center sm:justify-start items-center gap-1.5 sm:gap-2 mb-2.5 sm:mb-3">
                                                        {isPaid && !kost.is_checked_out && (
                                                            <span className={`px-2.5 sm:px-3.5 py-0.5 sm:py-1 rounded-full text-[8.5px] sm:text-[9px] font-black uppercase tracking-wider border flex items-center gap-1 sm:gap-1.5 ${
                                                                (kost.daysRemaining || 0) < 0 
                                                                    ? 'bg-gray-50 text-gray-400 border-gray-200' 
                                                                    : 'bg-emerald-50 text-emerald-600 border-emerald-200 shadow-sm shadow-emerald-100'
                                                            }`}>
                                                                <CheckCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                                                {(kost.daysRemaining || 0) < 0 ? 'SUDAH HABIS' : 'SEDANG DISEWA'}
                                                            </span>
                                                        )}

                                                        {(kost.is_checked_out || (kost.status || '').toUpperCase() === 'CHECKED_OUT') && (
                                                            <span className="px-2.5 sm:px-3.5 py-0.5 sm:py-1 rounded-full text-[8.5px] sm:text-[9px] font-black uppercase tracking-wider border flex items-center gap-1 sm:gap-1.5 bg-slate-100 text-slate-600 border-slate-200 shadow-sm">
                                                                <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-500" /> SELESAI (CHECK-OUT)
                                                            </span>
                                                        )}

                                                        {(kost.status || '').toUpperCase() === 'PENDING_APPROVAL' && (
                                                            <span className="px-2.5 sm:px-3.5 py-0.5 sm:py-1 rounded-full text-[8.5px] sm:text-[9px] font-black uppercase tracking-wider border flex items-center gap-1 sm:gap-1.5 bg-amber-50 text-amber-700 border-amber-200 shadow-sm">
                                                                <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500" /> MENUNGGU PERSETUJUAN
                                                            </span>
                                                        )}

                                                        {isAwaitingPayment && (
                                                            <span className="px-2.5 sm:px-3.5 py-0.5 sm:py-1 rounded-full text-[8.5px] sm:text-[9px] font-black uppercase tracking-wider border flex items-center gap-1 sm:gap-1.5 bg-orange-50 text-orange-600 border-orange-200 animate-pulse shadow-sm">
                                                                <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-orange-500" /> MENUNGGU PEMBAYARAN
                                                            </span>
                                                        )}

                                                        {isExpiredBooking && (
                                                            <span className="px-2.5 sm:px-3.5 py-0.5 sm:py-1 rounded-full text-[8.5px] sm:text-[9px] font-black uppercase tracking-wider border flex items-center gap-1 sm:gap-1.5 bg-rose-50 text-rose-600 border-rose-200 shadow-sm">
                                                                <XCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-rose-500" /> HANGUS (WAKTU HABIS)
                                                            </span>
                                                        )}

                                                        {(kost.status || '').toUpperCase() === 'CANCELLED' && (
                                                            <span className="px-2.5 sm:px-3.5 py-0.5 sm:py-1 rounded-full text-[8.5px] sm:text-[9px] font-black uppercase tracking-wider border flex items-center gap-1 sm:gap-1.5 bg-slate-100 text-slate-600 border-slate-200 shadow-sm">
                                                                <XCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-500" /> DIBATALKAN
                                                            </span>
                                                        )}

                                                        {kost.daysRemaining !== null && isPaid && !kost.is_checked_out && (
                                                            <div className={`px-2.5 sm:px-3.5 py-0.5 sm:py-1 rounded-full text-[8.5px] sm:text-[9px] font-black uppercase tracking-wider border flex items-center gap-1 sm:gap-1.5 ${
                                                                kost.daysRemaining <= 7 
                                                                    ? 'bg-red-50 text-red-600 border-red-200 animate-pulse shadow-sm' 
                                                                    : 'bg-orange-50 text-orange-600 border-orange-200'
                                                            }`}>
                                                                <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                                                {kost.daysRemaining < 0 ? 'Habis' : `${kost.daysRemaining} Hari Lagi`}
                                                            </div>
                                                        )}

                                                        {/* Specific Room Badge */}
                                                        <span className="px-2.5 sm:px-3.5 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-black text-white bg-orange-500 shadow-sm shadow-orange-200 uppercase tracking-wider flex items-center gap-1 sm:gap-1.5">
                                                            <DoorClosed className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                                            {kost.roomNumber ? `UNIT ${kost.roomNumber.toUpperCase()}` : 'KAMAR'}
                                                        </span>

                                                        <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[8.5px] sm:text-[9px] font-bold text-slate-700 uppercase tracking-wider bg-slate-100 border border-slate-200">
                                                            {kost.roomType || 'Standard'}
                                                        </span>

                                                        {kost.roomFloor && (
                                                            <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[8.5px] sm:text-[9px] font-bold text-slate-700 uppercase tracking-wider bg-slate-100 border border-slate-200 flex items-center gap-1">
                                                                <Layers className="w-3 h-3 text-slate-500" />
                                                                {kost.roomFloor.toLowerCase().includes('lantai') ? kost.roomFloor.toUpperCase() : `LANTAI ${kost.roomFloor.toUpperCase()}`}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Kost Name */}
                                                    <button
                                                        onClick={() => navigate(`${Page.DETAIL}?kostId=${kost.kostId}`)}
                                                        className="group/title inline-flex items-center justify-center sm:justify-start gap-2 text-xl sm:text-3xl lg:text-4xl font-black text-gray-900 leading-tight tracking-tight hover:text-orange-600 transition-colors mb-1.5 sm:mb-2 text-center sm:text-left w-full sm:w-auto"
                                                    >
                                                        <span className="uppercase">{kost.kostName || 'Kost Saya'}</span>
                                                        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 opacity-0 -translate-x-2 group-hover/title:opacity-100 group-hover/title:translate-x-0 transition-all text-orange-500 shrink-0" />
                                                    </button>

                                                    {/* Location Details & Verification */}
                                                    <div className="flex items-center justify-center sm:justify-start gap-1.5 text-gray-500 mb-2 w-full max-w-full px-1">
                                                        <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                                                        <span className="line-clamp-1 sm:truncate text-[11px] sm:text-xs text-gray-600 font-semibold text-center sm:text-left leading-relaxed">{kost.address || kost.areaCity || 'Makassar'}</span>
                                                    </div>

                                                    <div className="flex items-center justify-center sm:justify-start gap-2.5 sm:gap-3">
                                                        <div className="flex gap-0.5">
                                                            {[1, 2, 3, 4, 5].map((s) => (
                                                                <Star key={s} className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 fill-amber-400" />
                                                            ))}
                                                        </div>
                                                        <span className="text-[8.5px] sm:text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                                            <ShieldCheck className="w-3 h-3 text-emerald-500" /> Terverifikasi RuangSinggah
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Real-time Countdown Banner for AWAITING_PAYMENT */}
                                            {isAwaitingPayment && (
                                                <div className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl border flex flex-col sm:flex-row items-center justify-between gap-4 transition-all ${
                                                    expiry.isUrgent 
                                                        ? 'bg-gradient-to-r from-rose-50 via-red-50 to-orange-50 border-rose-200 text-rose-950 shadow-md shadow-rose-100/50' 
                                                        : 'bg-gradient-to-r from-orange-50/90 via-amber-50/70 to-orange-50/90 border-orange-200 text-orange-950 shadow-sm'
                                                }`}>
                                                    <div className="flex items-center gap-3.5 w-full sm:w-auto">
                                                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                                                            expiry.isUrgent ? 'bg-rose-500 text-white animate-pulse' : 'bg-orange-500 text-white'
                                                        }`}>
                                                            <Clock className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-[11px] font-black uppercase tracking-wider">Batas Waktu Pembayaran</p>
                                                                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-white/80 border border-orange-200/80 text-orange-700">1x24 Jam</span>
                                                            </div>
                                                            <p className="text-xs font-semibold opacity-85 mt-0.5">
                                                                {expiry.deadlineDate ? `Batas: ${expiry.deadlineDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}, ${String(expiry.deadlineDate.getHours()).padStart(2, '0')}:${String(expiry.deadlineDate.getMinutes()).padStart(2, '0')} WITA` : 'Segera selesaikan pembayaran untuk mengamankan kamar.'}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl shadow-sm border border-orange-100/80 font-mono text-sm font-black w-full sm:w-auto justify-center">
                                                        <div className="flex flex-col items-center min-w-[32px]">
                                                            <span className={`text-base leading-none font-extrabold ${expiry.isUrgent ? 'text-rose-600' : 'text-orange-600'}`}>
                                                                {String(expiry.hours).padStart(2, '0')}
                                                            </span>
                                                            <span className="text-[8px] font-sans text-gray-400 font-bold uppercase mt-0.5">Jam</span>
                                                        </div>
                                                        <span className="text-gray-300 font-sans pb-1 font-bold">:</span>
                                                        <div className="flex flex-col items-center min-w-[32px]">
                                                            <span className={`text-base leading-none font-extrabold ${expiry.isUrgent ? 'text-rose-600' : 'text-orange-600'}`}>
                                                                {String(expiry.minutes).padStart(2, '0')}
                                                            </span>
                                                            <span className="text-[8px] font-sans text-gray-400 font-bold uppercase mt-0.5">Mnt</span>
                                                        </div>
                                                        <span className="text-gray-300 font-sans pb-1 font-bold">:</span>
                                                        <div className="flex flex-col items-center min-w-[32px]">
                                                            <span className={`text-base leading-none font-extrabold ${expiry.isUrgent ? 'text-rose-600' : 'text-orange-600'}`}>
                                                                {String(expiry.seconds).padStart(2, '0')}
                                                            </span>
                                                            <span className="text-[8px] font-sans text-gray-400 font-bold uppercase mt-0.5">Dtk</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Expired Booking Banner */}
                                            {isExpiredBooking && (
                                                <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl border bg-rose-50/80 border-rose-200 text-rose-900 flex items-center gap-3.5 shadow-sm">
                                                    <div className="w-10 h-10 rounded-2xl bg-rose-500 text-white flex items-center justify-center shrink-0">
                                                        <AlertCircle className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-black uppercase tracking-wider">Pengajuan Sewa Telah Hangus</p>
                                                        <p className="text-xs font-medium text-rose-700/90 mt-0.5 leading-relaxed">
                                                            Batas waktu pembayaran 24 jam telah berakhir. Unit kamar telah otomatis dilepaskan kembali ke sistem. Anda dapat mengajukan sewa ulang kapan saja.
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Visual Progress Bar: Masa Sewa */}
                                            {isPaid && !kost.is_checked_out && (
                                                <div className="bg-gradient-to-r from-orange-50/70 via-amber-50/50 to-slate-50 p-3.5 sm:p-5 rounded-2xl border border-orange-100/80 shadow-sm flex flex-col gap-2 sm:gap-2.5">
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full bg-orange-500 animate-ping shrink-0" />
                                                            <span className="font-black text-gray-800 uppercase tracking-wider text-[10px] sm:text-[11px]">Masa Sewa Berjalan</span>
                                                        </div>
                                                        <span className="font-black text-orange-600 text-[11px] sm:text-xs">
                                                            Hari ke-{daysElapsed} dari {totalLeaseDays} Hari ({progressPercent}%)
                                                        </span>
                                                    </div>

                                                    {/* Track & Filled Bar */}
                                                    <div className="w-full h-2 sm:h-2.5 bg-gray-200/80 rounded-full overflow-hidden p-0.5 shadow-inner">
                                                        <div 
                                                            className="h-full bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-500 rounded-full transition-all duration-1000 shadow-sm"
                                                            style={{ width: `${Math.max(5, progressPercent)}%` }}
                                                        />
                                                    </div>

                                                    <div className="flex items-center justify-between text-[9px] sm:text-[10px] font-bold text-gray-500 pt-0.5">
                                                        <span>Mulai: <strong className="text-gray-800">{FORMAT_DATE(kost.moveInDate)}</strong></span>
                                                        <span>Berakhir: <strong className="text-gray-800">{FORMAT_DATE(kost.endDate)}</strong></span>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Info Grid - Modern Minimalist Cards (Anti-Truncate) */}
                                            {isPaid && (
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 w-full">
                                                    {[
                                                        { label: 'Durasi Sewa', value: `${kost.duration || 1} ${kost.period}`, subtext: 'Paket Sewa', icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50' },
                                                        { label: 'Mulai Masuk', value: FORMAT_DATE(kost.moveInDate), subtext: 'Check-in', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50' },
                                                        { label: 'Selesai Sewa', value: FORMAT_DATE(kost.endDate), subtext: 'Jatuh Tempo', icon: Calendar, color: 'text-rose-500', bg: 'bg-rose-50' },
                                                        { label: 'Tagihan Pokok', value: FORMAT_CURRENCY(kost.totalPrice || 0), subtext: 'Lunas', icon: Receipt, color: 'text-emerald-500', bg: 'bg-emerald-50' }
                                                    ].map((item, idx) => (
                                                        <div key={idx} className="p-2.5 sm:p-3.5 bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between gap-1.5 sm:gap-2 hover:border-orange-200 transition-colors group/stat">
                                                            <div className="flex items-center justify-between gap-1">
                                                                <div className={`w-7 h-7 sm:w-8 sm:h-8 ${item.bg} rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 group-hover/stat:scale-110 transition-transform`}>
                                                                    <item.icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${item.color}`} />
                                                                </div>
                                                                <span className="text-[8px] sm:text-[9px] font-bold text-gray-400 uppercase tracking-wider truncate">{item.subtext}</span>
                                                            </div>
                                                            <div>
                                                                <p className="text-[8px] sm:text-[9px] font-black text-gray-400 uppercase tracking-wider mb-0.5">{item.label}</p>
                                                                <p className="text-[11px] sm:text-sm font-black text-gray-900 leading-snug truncate">{item.value}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Right / Actions Sidebar */}
                                        <div className="lg:col-span-4 flex flex-col gap-2.5 sm:gap-3 justify-center relative z-10 w-full pt-5 lg:pt-0 border-t lg:border-t-0 lg:border-l border-gray-100 lg:pl-8">
                                            {/* Primary Action: Bayar Sekarang (Top Priority when AWAITING_PAYMENT) */}
                                            {isAwaitingPayment && (
                                                <button
                                                    onClick={() => {
                                                        const kMeta = kost.metadata || {};
                                                        const mDate = kost.moveInDate || kMeta.startDate || kMeta.move_in_date;
                                                        const monthYear = mDate ? new Date(mDate).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) : '';

                                                        setPaymentAmount(kost.totalPrice);
                                                        setPaymentOrderId(kost.id);
                                                        setPaymentProductId(kost.kostId);
                                                        setPaymentProductType('kost_booking');
                                                        setPaymentMetadata({
                                                            ...kMeta,
                                                            kostId: kost.kostId,
                                                            kostName: kost.kostName,
                                                            roomType: kost.roomType || kMeta.roomType || '-',
                                                            startDate: mDate,
                                                            userName: user.displayName || user.email?.split('@')[0] || 'Customer',
                                                            userEmail: user.email || '',
                                                            item_details: [
                                                                {
                                                                    id: `rent-${kost.kostId?.substring(0, 8)}`,
                                                                    price: Number(kMeta.basePrice || 0) + Number(kMeta.extraPersonFee || 0),
                                                                    quantity: 1,
                                                                    name: `Sewa Kost ${monthYear}${Number(kMeta.occupants || 1) > 1 ? ' + Extra Penghuni' : ''}`
                                                                },
                                                                ...(kMeta.facilityFee ? [{
                                                                    id: `facility-${kost.kostId?.substring(0, 8)}`,
                                                                    price: Number(kMeta.facilityFee),
                                                                    quantity: 1,
                                                                    name: kMeta.additionalFeeName || `Tagihan Fasilitas ${monthYear}`
                                                                }] : [])
                                                            ].filter(item => item.price > 0),
                                                            tenantName: user.displayName || user.email?.split('@')[0] || 'Customer',
                                                            propertyTitle: kost.kostName,
                                                            roomCategory: kost.roomType || kMeta.roomType || '-',
                                                            leaseStart: mDate,
                                                            leaseEnd: kMeta.endDate || '-'
                                                        });
                                                        setShowPaymentGateway(true);
                                                    }}
                                                    className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white p-3.5 sm:p-4 rounded-xl sm:rounded-2xl font-black flex flex-col items-center justify-center gap-1 transition-all shadow-lg shadow-orange-500/25 active:scale-[0.98] cursor-pointer group/pay"
                                                >
                                                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider">
                                                        <Receipt className="w-4 h-4 text-white group-hover:scale-110 transition-transform" /> 
                                                        <span>Bayar Sekarang</span>
                                                    </div>
                                                    <span className="text-[11px] font-black text-orange-100 tracking-tight">{FORMAT_CURRENCY(kost.totalPrice)}</span>
                                                </button>
                                            )}

                                            {/* Action for Expired Booking */}
                                            {isExpiredBooking && (
                                                <button
                                                    onClick={() => navigate(`${Page.DETAIL}?kostId=${kost.kostId}`)}
                                                    className="w-full bg-orange-500 hover:bg-orange-600 text-white px-4 sm:px-5 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl font-black flex items-center justify-center gap-2 sm:gap-2.5 transition-all text-[9.5px] sm:text-[10px] uppercase tracking-widest shadow-md active:scale-[0.98] cursor-pointer"
                                                >
                                                    <RotateCcw className="w-4 h-4" /> Ajukan Sewa Ulang
                                                </button>
                                            )}

                                            {/* Action for Checked-Out Booking */}
                                            {(kost.is_checked_out || (kost.status || '').toUpperCase() === 'CHECKED_OUT') && (
                                                <button
                                                    onClick={() => navigate(`${Page.DETAIL}?kostId=${kost.kostId}`)}
                                                    className="w-full bg-gray-900 hover:bg-black text-white px-4 sm:px-5 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl font-black flex items-center justify-center gap-2 sm:gap-2.5 transition-all text-[9.5px] sm:text-[10px] uppercase tracking-widest shadow-md active:scale-[0.98] cursor-pointer"
                                                >
                                                    <RotateCcw className="w-4 h-4 text-orange-400" /> Sewa Lagi
                                                </button>
                                            )}

                                            {/* Perpanjang Sewa (For Paid) */}
                                            {isPaid && !kost.is_checked_out && (
                                                <div className="flex flex-col gap-1 w-full">
                                                    <button
                                                        disabled={(kost.daysRemaining || 0) > 7}
                                                        onClick={() => handleOpenExtension(kost)}
                                                        className={`w-full ${(kost.daysRemaining || 0) > 7 ? 'bg-gray-50 text-gray-400 border border-gray-100 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-100 cursor-pointer'} px-4 sm:px-5 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl font-black flex items-center justify-center gap-2 sm:gap-2.5 transition-all text-[9.5px] sm:text-[10px] uppercase tracking-widest active:scale-[0.98] group/btn`}
                                                    >
                                                        <Plus className={`w-4 h-4 ${(kost.daysRemaining || 0) > 7 ? 'text-gray-300' : 'text-white'} group-hover:rotate-90 transition-transform`} /> Perpanjang Sewa
                                                    </button>
                                                    {(kost.daysRemaining || 0) > 7 && (
                                                        <p className="text-[8px] font-bold text-gray-400 text-center uppercase tracking-[0.15em]">
                                                            Tersedia dlm {(kost.daysRemaining || 0) - 7} hari
                                                        </p>
                                                    )}
                                                </div>
                                            )}

                                            {/* Rute Ke Kost */}
                                            <button
                                                onClick={() => {
                                                    if (kost.location?.lat && kost.location?.lng) {
                                                        window.open(`https://www.google.com/maps/dir/?api=1&destination=${kost.location.lat},${kost.location.lng}`, '_blank');
                                                    } else if (kost.locationUrl) {
                                                        window.open(kost.locationUrl, '_blank');
                                                    } else if (kost.address) {
                                                        window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(kost.address)}`, '_blank');
                                                    } else {
                                                        alert('Lokasi belum tersedia');
                                                    }
                                                }}
                                                className="w-full bg-gray-900 hover:bg-black text-white px-4 sm:px-5 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl font-black flex items-center justify-center gap-2 sm:gap-2.5 transition-all text-[9.5px] sm:text-[10px] uppercase tracking-widest shadow-md active:scale-[0.98] group/btn cursor-pointer"
                                            >
                                                <MapPin className="w-4 h-4 text-orange-500 group-hover:scale-110 transition-transform" /> Rute Ke Kost
                                            </button>

                                            {/* Hubungi Pengelola / Pemilik */}
                                            <button
                                                onClick={() => handleOpenChat(kost)}
                                                className="w-full bg-white hover:bg-emerald-50 text-emerald-600 border-2 border-emerald-100 px-4 sm:px-5 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl font-black flex items-center justify-center gap-2 sm:gap-2.5 transition-all text-[9.5px] sm:text-[10px] uppercase tracking-widest active:scale-[0.98] cursor-pointer"
                                            >
                                                <Smartphone className="w-4 h-4" /> {kost.isManagedKost ? 'Bantuan KostManager' : 'Hubungi Pemilik'}
                                            </button>

                                            {/* Lapor Kendala Fasilitas Kamar */}
                                            {isPaid && !kost.is_checked_out && (
                                                <button
                                                    onClick={() => handleOpenComplaint(kost)}
                                                    className="w-full bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-black flex items-center justify-center gap-2 transition-all text-[9px] uppercase tracking-widest active:scale-[0.98] cursor-pointer"
                                                >
                                                    <Wrench className="w-3.5 h-3.5 text-rose-500" /> Lapor Kendala Kamar
                                                </button>
                                            )}

                                            {/* Pending & Awaiting Payment Actions: Batalkan Pengajuan */}
                                            {['PENDING_APPROVAL', 'AWAITING_PAYMENT', 'PENDING'].includes((kost.status || '').toUpperCase()) && !isExpiredBooking && (
                                                <button
                                                    onClick={() => handleCancelBooking(kost)}
                                                    className="w-full bg-white border-2 border-gray-100 hover:border-red-500 hover:bg-red-50 hover:text-red-600 text-gray-500 p-3 sm:p-3.5 rounded-xl sm:rounded-2xl font-black flex items-center justify-center gap-2 transition-all text-[9.5px] sm:text-[10px] uppercase tracking-widest active:scale-[0.98] group/cancel cursor-pointer"
                                                >
                                                    <XCircle className="w-4 h-4 group-hover/cancel:rotate-90 transition-transform" /> Batalkan Pengajuan
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="bg-white rounded-[3.5rem] p-12 sm:p-24 shadow-2xl shadow-gray-100 border border-gray-50 text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <div className="relative inline-block mb-10">
                            <div className="w-32 h-32 bg-orange-50 rounded-full flex items-center justify-center animate-pulse">
                                <Search className="w-12 h-12 text-orange-200" />
                            </div>
                            <div className="absolute top-0 right-0 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center border border-gray-50 animate-bounce">
                                <X className="w-6 h-6 text-orange-500" />
                            </div>
                        </div>
                        <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight mb-4">
                            {activeTab === 'diajukan' ? 'Belum Ada Pengajuan' : activeTab === 'aktif' ? 'Belum Ada Kost Aktif' : 'Belum Ada Riwayat'}
                        </h2>
                        <p className="text-gray-500 font-medium max-w-sm mx-auto mb-10 leading-relaxed">
                            {activeTab === 'diajukan'
                                ? 'Sepertinya Anda belum mengajukan sewa kost apa pun. Yuk cari hunian impianmu sekarang!'
                                : activeTab === 'aktif'
                                    ? 'Anda belum memiliki hunian yang aktif. Jangan khawatir, kost incaranmu hanya berjarak satu klik!'
                                    : 'Belum ada riwayat penyewaan kost di akun Anda.'}
                        </p>
                        <button
                            onClick={() => navigate(Page.LISTINGS)}
                            className="bg-orange-500 hover:bg-orange-600 text-white px-10 py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl shadow-orange-200 transition-all active:scale-95 flex items-center gap-3 mx-auto"
                        >
                            MULAI CARI SEKARANG
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </div>

            {/* 1. Modal Perpanjangan Sewa */}
            {showExtensionModal && selectedKost && (() => {
                const nowSim = getCurrentDate();
                const currentEnd = parseDateSafely(selectedKost.endDate) || nowSim;
                const newStart = new Date(currentEnd);
                const newEnd = new Date(currentEnd);
                newEnd.setMonth(newEnd.getMonth() + extensionPeriod);
                const diffMs = newEnd.getTime() - newStart.getTime();
                const totalDays = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));

                const timeline = {
                    currentStartFormatted: FORMAT_DATE(selectedKost.moveInDate || selectedKost.startDate),
                    currentEndFormatted: FORMAT_DATE(selectedKost.endDate),
                    newStartFormatted: FORMAT_DATE(newStart),
                    newEndFormatted: FORMAT_DATE(newEnd),
                    totalDays
                };

                // Filter Riwayat Transaksi Perpanjangan / Pembayaran Sewa untuk Unit ini
                const kid = (selectedKost.kostId || selectedKost.id || '').toString();
                const currentResId = selectedKost.residentStatusId || selectedKost.id;
                const currentSessionId = selectedKost.metadata?.booking_session_id;

                const extensionHistoryList = (allUserTransactions || []).filter((t: any) => {
                    const tKid = (t.product_id || t.kost_id || '').toString();
                    const tResId = t.resident_status_id || t.metadata?.resident_status_id;
                    const tSessionId = t.metadata?.booking_session_id;
                    const s = (t.status || '').toLowerCase();
                    const isPaid = ['paid', 'success', 'berhasil', 'settlement', 'capture', 'completed', 'done'].includes(s);

                    const isMatch = (tKid === kid || t.metadata?.kostId === kid) &&
                        (tResId === currentResId || (currentSessionId && tSessionId === currentSessionId) || (!tResId && !tSessionId));

                    const pType = (t.product_type || t.type || '').toLowerCase();
                    const isRentOrExt = pType === 'perpanjangan_sewa' || pType === 'kost_booking' || pType === 'rent' || pType === 'tagihan_ekstra' || (t.metadata?.billName || '').toLowerCase().includes('sewa');

                    return isMatch && isPaid && isRentOrExt;
                }).sort((a: any, b: any) => new Date(b.created_at || b.updated_at).getTime() - new Date(a.created_at || a.updated_at).getTime());

                return (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm overflow-y-auto">
                        <div className="bg-white rounded-[3rem] w-full max-w-lg my-auto relative shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                            {/* Header Gradient */}
                            <div className="bg-gradient-to-r from-orange-600 to-orange-500 p-7 text-white relative">
                                <button onClick={() => setShowExtensionModal(false)} className="absolute top-6 right-6 text-white/70 hover:text-white bg-black/10 hover:bg-black/20 rounded-full p-2 transition-colors cursor-pointer">
                                    <X className="w-5 h-5" />
                                </button>
                                <div className="flex items-center gap-3.5 mb-2">
                                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md shrink-0">
                                        <Clock className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl sm:text-2xl font-black tracking-tight leading-snug">Perpanjang Masa Sewa</h3>
                                        <p className="text-orange-100 text-xs font-bold uppercase tracking-widest">{selectedKost.kostName}</p>
                                    </div>
                                </div>

                                {/* Tab Switcher: Form vs Riwayat */}
                                <div className="flex bg-black/15 p-1 rounded-2xl mt-4 backdrop-blur-md border border-white/10">
                                    <button
                                        type="button"
                                        onClick={() => setExtensionTab('form')}
                                        className={`flex-1 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                            extensionTab === 'form' ? 'bg-white text-orange-600 shadow-md' : 'text-white/80 hover:text-white'
                                        }`}
                                    >
                                        <Plus className="w-3.5 h-3.5" /> Form Perpanjangan
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setExtensionTab('history')}
                                        className={`flex-1 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                            extensionTab === 'history' ? 'bg-white text-orange-600 shadow-md' : 'text-white/80 hover:text-white'
                                        }`}
                                    >
                                        <Receipt className="w-3.5 h-3.5" /> Riwayat ({extensionHistoryList.length})
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 sm:p-8 max-h-[72vh] overflow-y-auto custom-scrollbar">
                                {/* TAB 1: FORM PERPANJANGAN */}
                                {extensionTab === 'form' && (
                                    <div className="space-y-6">
                                        {/* Status Masa Sewa Berjalan Saat Ini */}
                                        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-5 rounded-[2rem] text-white shadow-md relative overflow-hidden border border-slate-700/50">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <div className="flex items-center gap-1.5 text-orange-400 text-[10px] font-black uppercase tracking-[0.2em]">
                                                        <Clock className="w-3.5 h-3.5" /> Masa Sewa Berjalan
                                                    </div>
                                                    <p className="text-sm font-extrabold text-white mt-0.5">
                                                        {selectedKost.roomNumber || selectedKost.roomType || 'Kamar'} • {selectedKost.roomType || 'Standard'}
                                                    </p>
                                                </div>
                                                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[9px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                                    {selectedKost.daysRemaining !== null && selectedKost.daysRemaining !== undefined ? `${selectedKost.daysRemaining} Hari Tersisa` : 'Aktif'}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-700/60 text-xs">
                                                <div>
                                                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest block mb-0.5">Mulai Masuk</span>
                                                    <span className="font-bold text-slate-100">{timeline.currentStartFormatted}</span>
                                                </div>
                                                <div>
                                                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest block mb-0.5">Jatuh Tempo Saat Ini</span>
                                                    <span className="font-bold text-orange-300">{timeline.currentEndFormatted}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Duration Selector */}
                                        <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-3">Pilih Durasi Perpanjangan</label>
                                            <div className="flex items-center justify-between bg-white p-2 rounded-2xl border border-gray-200 shadow-xs">
                                                <button
                                                    type="button"
                                                    onClick={() => setExtensionPeriod(Math.max(1, extensionPeriod - 1))}
                                                    className="w-12 h-12 flex items-center justify-center bg-gray-900 hover:bg-orange-500 text-white rounded-xl font-black text-lg transition-all active:scale-90 shadow-lg shadow-gray-200 cursor-pointer"
                                                >
                                                    -
                                                </button>
                                                <div className="text-center">
                                                    <span className="text-2xl font-black text-gray-900">{extensionPeriod}</span>
                                                    <span className="text-sm font-bold text-gray-500 ml-2">Bulan</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setExtensionPeriod(extensionPeriod + 1)}
                                                    className="w-12 h-12 flex items-center justify-center bg-gray-900 hover:bg-orange-500 text-white rounded-xl font-black text-lg transition-all active:scale-90 shadow-lg shadow-gray-200 cursor-pointer"
                                                >
                                                    +
                                                </button>
                                            </div>

                                            {/* Rental Packages Options */}
                                            {(() => {
                                                const currentRoom = (selectedKost.room_types || []).find((r: any) => r.name === selectedKost.roomType);
                                                const availablePackages = (currentRoom?.pricing || []).filter((p: any) => p.price > 0 && !['harian', 'mingguan'].includes(p.period));

                                                if (availablePackages.length === 0) return null;

                                                const periodToMonths: Record<string, number> = {
                                                    'bulanan': 1,
                                                    '3bulanan': 3,
                                                    '6bulanan': 6,
                                                    'tahunan': 12
                                                };

                                                return (
                                                    <div className="mt-5 pt-4 border-t border-gray-200/60">
                                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-3">Atau Pilih Paket Durasi</label>
                                                        <div className="grid grid-cols-2 gap-2.5">
                                                            {availablePackages.map((pkg: any) => {
                                                                const meta = selectedKost.metadata || {};
                                                                let currentEp = Number(meta.extraPersonFee || meta.extra_person_fee || meta.additionalCostPerPerson || 0);
                                                                if (!currentEp && selectedKost.totalPrice > pkg.price) {
                                                                    currentEp = (selectedKost.totalPrice / selectedKost.duration) - pkg.price;
                                                                }
                                                                const displayPrice = pkg.price + (currentEp > 0 ? currentEp : 0);
                                                                const isSelectedPkg = extensionPeriod === periodToMonths[pkg.period];

                                                                return (
                                                                    <button
                                                                        key={pkg.period}
                                                                        type="button"
                                                                        onClick={() => setExtensionPeriod(periodToMonths[pkg.period] || 1)}
                                                                        className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                                                                            isSelectedPkg
                                                                                ? 'border-orange-500 bg-orange-50/80 shadow-xs'
                                                                                : 'border-gray-150 bg-white hover:border-orange-200'
                                                                        }`}
                                                                    >
                                                                        <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isSelectedPkg ? 'text-orange-600' : 'text-gray-400'}`}>
                                                                            Paket {
                                                                                pkg.period === 'bulanan' ? 'Bulanan' :
                                                                                    pkg.period === '3bulanan' ? '3 Bulan' :
                                                                                        pkg.period === '6bulanan' ? '6 Bulan' :
                                                                                            pkg.period === 'tahunan' ? 'Tahunan' : pkg.period
                                                                            }
                                                                        </p>
                                                                        <p className="text-xs sm:text-sm font-black text-gray-900">{FORMAT_CURRENCY(displayPrice)}</p>
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>

                                        {/* Live Simulation Timeline Card */}
                                        <div className="bg-orange-50/80 p-5 rounded-[2rem] border border-orange-200/80 shadow-xs space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-black text-orange-950 uppercase tracking-[0.2em] flex items-center gap-1.5">
                                                    <Calendar className="w-3.5 h-3.5 text-orange-500" />
                                                    Simulasi Periode Bersambung
                                                </span>
                                                <span className="text-[10px] font-black text-orange-700 bg-orange-100 px-2.5 py-0.5 rounded-full border border-orange-200">
                                                    +{timeline.totalDays} Hari ({extensionPeriod} Bulan)
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 bg-white p-3.5 rounded-2xl border border-orange-100 text-xs">
                                                <div>
                                                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest block mb-0.5">Mulai Bersambung</span>
                                                    <span className="font-extrabold text-gray-800">{timeline.newStartFormatted}</span>
                                                </div>
                                                <div className="border-l border-orange-100 pl-3">
                                                    <span className="text-[9px] text-orange-600 font-bold uppercase tracking-widest block mb-0.5">Jatuh Tempo Baru</span>
                                                    <span className="font-extrabold text-orange-600">{timeline.newEndFormatted}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 text-[10.5px] font-bold text-orange-900 bg-white/70 px-3.5 py-2.5 rounded-xl border border-orange-100/80">
                                                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                                                <span>Masa tinggal Anda akan otomatis bersambung hingga <strong>{timeline.newEndFormatted}</strong> tanpa jeda.</span>
                                            </div>
                                        </div>

                                        {/* Price Breakdown */}
                                        <div className="space-y-3">
                                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-2">Rincian Pembayaran Perpanjangan</h4>
                                            <div className="bg-white border-2 border-dashed border-gray-100 rounded-[2rem] p-6 space-y-4">
                                                {(() => {
                                                    const meta = selectedKost.metadata || {};
                                                    const period = selectedKost.period?.toLowerCase() || 'bulanan';

                                                    let bp = Number(meta.basePrice || selectedKost.basePrice || 0);
                                                    let ep = Number(meta.extraPersonFee || meta.extra_person_fee || meta.additionalCostPerPerson || 0);

                                                    if (!bp && meta.composition?.baseRent) {
                                                        const dur = Number(meta.extensionPeriod || meta.total_months || 1);
                                                        bp = Number(meta.composition.baseRent) / dur;
                                                    }
                                                    if (!ep && meta.composition?.extraPersonFee) {
                                                        const dur = Number(meta.extensionPeriod || meta.total_months || 1);
                                                        ep = Number(meta.composition.extraPersonFee) / dur;
                                                    }

                                                    if (selectedKost.room_types) {
                                                        const room = (selectedKost.room_types || []).find((r: any) => r.name === selectedKost.roomType);
                                                        if (room) {
                                                            const pricing = (room.pricing || []).find((p: any) => p.period === period);
                                                            if (pricing) bp = Number(pricing.price);

                                                            const occupantsCount = Number(meta.occupants || meta.occupantsCount || meta.composition?.occupants || 1);
                                                            const roomEp = Number(room.additionalCostPerPerson || room.extra_person_fee || room.extra_occupant_fee || 0);

                                                            if (roomEp > 0 && occupantsCount > 1) {
                                                                const periodWeights: Record<string, number> = {
                                                                    'harian': 1, 'mingguan': 7, 'bulanan': 30, '3bulanan': 90, '6bulanan': 180, 'tahunan': 360
                                                                };
                                                                const availablePeriods = room.pricing?.map((p: any) => p.period) || ['bulanan'];
                                                                const lowestPeriod = availablePeriods.reduce((min: string, p: string) =>
                                                                    (periodWeights[p] || 30) < (periodWeights[min] || 30) ? p : min, availablePeriods[0]);

                                                                const proportion = (periodWeights[period] || 30) / (periodWeights[lowestPeriod] || 30);
                                                                const dynamicEp = Math.max(0, occupantsCount - 1) * Math.round(roomEp * proportion);
                                                                if (dynamicEp > 0) ep = dynamicEp;
                                                            }
                                                        }
                                                    }

                                                    if (!bp) {
                                                        bp = (Number(selectedKost.totalPrice || 0) / (Number(selectedKost.duration || 1))) - ep;
                                                        if (bp <= 0) bp = (Number(selectedKost.totalPrice || 0) / (Number(selectedKost.duration || 1)));
                                                    }

                                                    if (Number(selectedKost.totalPrice) > bp && ep === 0) {
                                                        ep = Number(selectedKost.totalPrice) - bp;
                                                    }

                                                    const occupantsCount = Number(meta.occupants || meta.occupantsCount || meta.composition?.occupants || 1);

                                                    return (
                                                        <>
                                                            <div className="flex justify-between items-center text-sm">
                                                                <div className="flex flex-col">
                                                                    <span className="text-gray-500 font-medium">Sewa Pokok Kamar ({extensionPeriod} Bulan)</span>
                                                                </div>
                                                                <span className="text-gray-900 font-black">
                                                                    {FORMAT_CURRENCY(bp * extensionPeriod)}
                                                                </span>
                                                            </div>
                                                            
                                                            {ep > 0 && (
                                                                <div className="flex justify-between items-center text-sm pt-4 border-t border-dashed border-gray-100">
                                                                    <div className="flex flex-col">
                                                                        <span className="text-gray-500 font-medium">Extra Penghuni Tambahan ({extensionPeriod} Bulan)</span>
                                                                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Maks. Kapasitas {occupantsCount} Orang</span>
                                                                    </div>
                                                                    <span className="text-gray-900 font-black">
                                                                        {FORMAT_CURRENCY(ep * extensionPeriod)}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </>
                                                    );
                                                })()}

                                                {selectedKost.additionalFeePrice > 0 && (() => {
                                                    const targetDate = new Date(currentEnd);
                                                    targetDate.setMonth(targetDate.getMonth() + 1);

                                                    const isAlreadyPaid = (selectedKost.pendingBills || []).some((b: any) => {
                                                        const s = (b.status || '').toLowerCase();
                                                        const isPaid = ['paid', 'success', 'berhasil', 'settlement', 'capture', 'completed', 'done'].includes(s);
                                                        if (!isPaid) return false;

                                                        const bMeta = b.metadata || {};
                                                        const bName = (b.bill_name || b.name || bMeta.bill_name || bMeta.billName || '').toLowerCase();
                                                        const isFac = bName.includes('air') || bName.includes('listrik') || bName.includes('wifi') || bName.includes('fasilitas');
                                                        const isBundle = bName.includes('total') || bName.includes('semua') || bMeta.is_batch_split_child || bMeta.is_batch_split_parent || bMeta.is_bundled_parent;
                                                        
                                                        if (!isFac && !isBundle) return false;
                                                        
                                                        const bDate = parseDateSafely(bMeta.original_due_date || bMeta.simulated_date || b.dueDate || b.due_date || b.created_at);
                                                        let isSameMonth = bDate && bDate.getMonth() === targetDate.getMonth() && bDate.getFullYear() === targetDate.getFullYear();

                                                        if (!isSameMonth) {
                                                            const monthMap: any = { 'januari': 0, 'februari': 1, 'maret': 2, 'april': 3, 'mei': 4, 'juni': 5, 'juli': 6, 'agustus': 7, 'september': 8, 'oktober': 9, 'november': 10, 'desember': 11, 'january': 0, 'february': 1, 'march': 2, 'may': 4, 'june': 5, 'july': 6, 'august': 7, 'october': 9, 'december': 11 };
                                                            const targetYear = targetDate.getFullYear();
                                                            const targetMonthIdx = targetDate.getMonth();
                                                            
                                                            const yearMatch = bName.match(/\d{4}/);
                                                            const nameMonthMatch = bName.match(/(januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember|january|february|march|may|june|july|august|september|october|november|december)/i);
                                                            
                                                            if (yearMatch && nameMonthMatch) {
                                                                const bYear = parseInt(yearMatch[0]);
                                                                const bMonthIdx = monthMap[nameMonthMatch[0].toLowerCase()];
                                                                if (bYear === targetYear && bMonthIdx === targetMonthIdx) {
                                                                    isSameMonth = true;
                                                                }
                                                            }
                                                        }

                                                        return isSameMonth;
                                                    });

                                                    if (isAlreadyPaid && includeFacilityInExtension) {
                                                        setTimeout(() => setIncludeFacilityInExtension(false), 0);
                                                    }

                                                    return (
                                                        <div
                                                            className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${isAlreadyPaid ? 'border-gray-200 bg-gray-100/50 cursor-not-allowed opacity-75' : (includeFacilityInExtension ? 'border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-100 cursor-pointer' : 'border-gray-100 bg-gray-50 cursor-pointer')}`}
                                                            onClick={() => !isAlreadyPaid && setIncludeFacilityInExtension(!includeFacilityInExtension)}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${isAlreadyPaid ? 'bg-gray-300 text-white' : (includeFacilityInExtension ? 'bg-emerald-500 text-white' : 'bg-white border-2 border-gray-200')}`}>
                                                                    {isAlreadyPaid ? <Check className="w-4 h-4 stroke-[4]" /> : (includeFacilityInExtension && <Check className="w-4 h-4 stroke-[4]" />)}
                                                                </div>
                                                                <div>
                                                                    <p className="text-[10px] font-black text-gray-900 uppercase tracking-wider">
                                                                        {isAlreadyPaid ? 'Fasilitas Sudah Lunas' : 'Bayar Tagihan Fasilitas?'}
                                                                    </p>
                                                                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                                                                        {isAlreadyPaid ? 'Terdeteksi di Riwayat' : (selectedKost.additionalFeeName || 'Listrik, Air, Wifi')}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <span className={`text-[11px] font-black ${isAlreadyPaid ? 'text-gray-400' : 'text-emerald-600'}`}>
                                                                {isAlreadyPaid ? 'Lunas' : `+ ${FORMAT_CURRENCY(selectedKost.additionalFeePrice)}`}
                                                            </span>
                                                        </div>
                                                    );
                                                })()}

                                                <div className="flex justify-between items-center pt-2">
                                                    <span className="text-gray-900 font-black uppercase tracking-widest text-xs">Total Pembayaran</span>
                                                    <span className="text-2xl font-black text-orange-600">
                                                        {(() => {
                                                            const meta = selectedKost.metadata || {};
                                                            const period = selectedKost.period?.toLowerCase() || 'bulanan';
                                                            let bp = Number(meta.basePrice || selectedKost.basePrice || 0);
                                                            let ep = Number(meta.extraPersonFee || meta.extra_person_fee || meta.additionalCostPerPerson || 0);

                                                            if (!bp && meta.composition?.baseRent) {
                                                                const dur = Number(meta.extensionPeriod || meta.total_months || 1);
                                                                bp = Number(meta.composition.baseRent) / dur;
                                                            }
                                                            if (!ep && meta.composition?.extraPersonFee) {
                                                                const dur = Number(meta.extensionPeriod || meta.total_months || 1);
                                                                ep = Number(meta.composition.extraPersonFee) / dur;
                                                            }

                                                            if (selectedKost.room_types) {
                                                                const room = (selectedKost.room_types || []).find((r: any) => r.name === selectedKost.roomType);
                                                                if (room) {
                                                                    const pricing = (room.pricing || []).find((p: any) => p.period === period);
                                                                    if (pricing) bp = Number(pricing.price);
                                                                    const occupantsCount = Number(meta.occupants || meta.occupantsCount || meta.composition?.occupants || 1);
                                                                    const roomEp = Number(room.additionalCostPerPerson || room.extra_person_fee || room.extra_occupant_fee || 0);

                                                                    if (roomEp > 0 && occupantsCount > 1) {
                                                                        const periodWeights: Record<string, number> = { 'harian': 1, 'mingguan': 7, 'bulanan': 30, '3bulanan': 90, '6bulanan': 180, 'tahunan': 360 };
                                                                        const availablePeriods = room.pricing?.map((p: any) => p.period) || ['bulanan'];
                                                                        const lowestPeriod = availablePeriods.reduce((min: string, p: string) => (periodWeights[p] || 30) < (periodWeights[min] || 30) ? p : min, availablePeriods[0]);
                                                                        const proportion = (periodWeights[period] || 30) / (periodWeights[lowestPeriod] || 30);
                                                                        const dynamicEp = Math.max(0, occupantsCount - 1) * Math.round(roomEp * proportion);
                                                                        if (dynamicEp > 0) ep = dynamicEp;
                                                                    }
                                                                }
                                                            }

                                                            if (!bp) {
                                                                bp = (Number(selectedKost.totalPrice || 0) / (Number(selectedKost.duration || 1))) - ep;
                                                                if (bp <= 0) bp = (Number(selectedKost.totalPrice || 0) / (Number(selectedKost.duration || 1)));
                                                            }

                                                            if (Number(selectedKost.totalPrice) > bp && ep === 0) {
                                                                ep = Number(selectedKost.totalPrice) - bp;
                                                            }

                                                            const monthlyFacility = Number(selectedKost.additionalFeePrice || 0);
                                                            const total = ((bp + ep) * extensionPeriod) + (includeFacilityInExtension ? monthlyFacility : 0);
                                                            return FORMAT_CURRENCY(total);
                                                        })()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex gap-3 items-start">
                                            <span className="text-base">⚡</span>
                                            <p className="text-[11px] text-blue-800 font-medium leading-relaxed">
                                                Pembayaran sewa pokok akan memperpanjang masa tinggal Anda. Tagihan fasilitas dapat dibayar sekaligus atau terpisah melalui menu Tagihan.
                                            </p>
                                        </div>

                                        <div className="pt-2 flex gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setShowExtensionModal(false)}
                                                className="flex-1 py-4 text-gray-500 font-black uppercase text-[11px] tracking-widest hover:bg-gray-50 rounded-2xl transition-colors border border-gray-200 cursor-pointer"
                                            >
                                                Batal
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const meta = selectedKost.metadata || {};
                                                    const period = selectedKost.period?.toLowerCase() || 'bulanan';

                                                    let bp = Number(meta.basePrice || selectedKost.basePrice || 0);
                                                    let ep = Number(meta.extraPersonFee || meta.extra_person_fee || meta.additionalCostPerPerson || 0);

                                                    if (!bp && meta.composition?.baseRent) {
                                                        const dur = Number(meta.extensionPeriod || meta.total_months || 1);
                                                        bp = Number(meta.composition.baseRent) / dur;
                                                    }
                                                    if (!ep && meta.composition?.extraPersonFee) {
                                                        const dur = Number(meta.extensionPeriod || meta.total_months || 1);
                                                        ep = Number(meta.composition.extraPersonFee) / dur;
                                                    }

                                                    if (selectedKost.room_types) {
                                                        const room = (selectedKost.room_types || []).find((r: any) => r.name === selectedKost.roomType);
                                                        if (room) {
                                                            const pricing = (room.pricing || []).find((p: any) => p.period === period);
                                                            if (pricing) bp = Number(pricing.price);
                                                            const occupantsCount = Number(meta.occupants || meta.occupantsCount || meta.composition?.occupants || 1);
                                                            const roomEp = Number(room.additionalCostPerPerson || room.extra_person_fee || room.extra_occupant_fee || 0);

                                                            if (roomEp > 0 && occupantsCount > 1) {
                                                                const periodWeights: Record<string, number> = { 'harian': 1, 'mingguan': 7, 'bulanan': 30, '3bulanan': 90, '6bulanan': 180, 'tahunan': 360 };
                                                                const availablePeriods = room.pricing?.map((p: any) => p.period) || ['bulanan'];
                                                                const lowestPeriod = availablePeriods.reduce((min: string, p: string) => (periodWeights[p] || 30) < (periodWeights[min] || 30) ? p : min, availablePeriods[0]);
                                                                const proportion = (periodWeights[period] || 30) / (periodWeights[lowestPeriod] || 30);
                                                                const dynamicEp = Math.max(0, occupantsCount - 1) * Math.round(roomEp * proportion);
                                                                if (dynamicEp > 0) ep = dynamicEp;
                                                            }
                                                        }
                                                    }

                                                    if (!bp) {
                                                        bp = (Number(selectedKost.totalPrice || 0) / (Number(selectedKost.duration || 1))) - ep;
                                                        if (bp <= 0) bp = (Number(selectedKost.totalPrice || 0) / (Number(selectedKost.duration || 1)));
                                                    }

                                                    if (selectedKost.totalPrice > bp && ep === 0) {
                                                        ep = selectedKost.totalPrice - bp;
                                                    }

                                                    const monthlyFacility = Number(selectedKost.additionalFeePrice || 0);
                                                    const total = ((bp + ep) * extensionPeriod) + (includeFacilityInExtension ? monthlyFacility : 0);

                                                    const targetDate = new Date(currentEnd);
                                                    targetDate.setMonth(targetDate.getMonth() + 1);
                                                    
                                                    const monthYear = targetDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
                                                    const billNameStr = `Sewa Kost ${monthYear} (${extensionPeriod} Bulan)`;

                                                    let existingFacilityId = null;
                                                    if (includeFacilityInExtension) {
                                                        const bills = selectedKost.pendingBills || [];
                                                        const facilityBills = bills.filter((b: any) => {
                                                            const bMeta = b.metadata || {};
                                                            const bName = (b.bill_name || b.name || bMeta.bill_name || bMeta.billName || '').toLowerCase();
                                                            const isFac = bName.includes('air') || bName.includes('listrik') || bName.includes('wifi') || bName.includes('fasilitas');
                                                            const s = (b.status || '').toLowerCase();
                                                            const isUnpaid = !['paid', 'success', 'berhasil', 'settlement', 'capture', 'completed', 'done'].includes(s);
                                                            return isFac && isUnpaid;
                                                        });

                                                        const targetMatch = facilityBills.find((b: any) => {
                                                            const bMeta = b.metadata || {};
                                                            const bName = (b.bill_name || b.name || bMeta.bill_name || bMeta.billName || '').toLowerCase();
                                                            
                                                            const bDate = parseDateSafely(bMeta.original_due_date || bMeta.simulated_date || b.dueDate || b.due_date || b.created_at);
                                                            let isSameMonth = bDate && bDate.getMonth() === targetDate.getMonth() && bDate.getFullYear() === targetDate.getFullYear();

                                                            if (!isSameMonth) {
                                                                const monthMap: any = { 'januari': 0, 'februari': 1, 'maret': 2, 'april': 3, 'mei': 4, 'juni': 5, 'juli': 6, 'agustus': 7, 'september': 8, 'oktober': 9, 'november': 10, 'desember': 11, 'january': 0, 'february': 1, 'march': 2, 'may': 4, 'june': 5, 'july': 6, 'august': 7, 'october': 9, 'december': 11 };
                                                                const targetYear = targetDate.getFullYear();
                                                                const targetMonthIdx = targetDate.getMonth();
                                                                
                                                                const yearMatch = bName.match(/\d{4}/);
                                                                const nameMonthMatch = bName.match(/(januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember|january|february|march|may|june|july|august|september|october|november|december)/i);
                                                                
                                                                if (yearMatch && nameMonthMatch) {
                                                                    const bYear = parseInt(yearMatch[0]);
                                                                    const bMonthIdx = monthMap[nameMonthMatch[0].toLowerCase()];
                                                                    if (bYear === targetYear && bMonthIdx === targetMonthIdx) {
                                                                        isSameMonth = true;
                                                                    }
                                                                }
                                                            }
                                                            return isSameMonth;
                                                        });

                                                        const bestMatch = targetMatch || facilityBills[0];

                                                        if (bestMatch) {
                                                            existingFacilityId = bestMatch.id;
                                                            console.log("FOUND_MATCHING_FACILITY_BILL:", existingFacilityId, bestMatch.bill_name);
                                                        }
                                                    }

                                                    handleStartPayment(total, selectedKost.kostId, 'perpanjangan_sewa', {
                                                        extensionPeriod,
                                                        masa_sewa_hari: timeline.totalDays,
                                                        extensionType: 'manual_extension',
                                                        includeFacility: includeFacilityInExtension,
                                                        facilityAmount: includeFacilityInExtension ? monthlyFacility : 0,
                                                        kostName: selectedKost.kostName,
                                                        startDate: selectedKost.endDate,
                                                        roomType: selectedKost.roomType,
                                                        originalTransactionId: selectedKost.id,
                                                        occupants: Number(meta.occupants || meta.occupantsCount || meta.composition?.occupants || 1),
                                                        basePrice: bp,
                                                        extraPersonFee: ep,
                                                        booking_session_id: meta.booking_session_id || selectedKost.metadata?.booking_session_id,
                                                        resident_status_id: selectedKost.id,
                                                        bill_name: billNameStr,
                                                        billName: billNameStr,
                                                        original_due_date: targetDate.toISOString(),
                                                        composition: {
                                                            baseRent: bp * extensionPeriod,
                                                            extraPersonFee: ep * extensionPeriod,
                                                            facilityFee: includeFacilityInExtension ? monthlyFacility : 0,
                                                            occupants: Number(meta.occupants || meta.occupantsCount || meta.composition?.occupants || 1)
                                                        },
                                                        existing_facility_id: existingFacilityId,
                                                        item_details: [
                                                            {
                                                                id: `rent-ext-${selectedKost.kostId?.substring(0, 8)}`,
                                                                price: (bp + ep) * extensionPeriod,
                                                                quantity: 1,
                                                                name: `${billNameStr}${Number(meta.occupants || 1) > 1 ? ' +Extra' : ''}`.substring(0, 50),
                                                                metadata: {
                                                                    original_due_date: targetDate.toISOString(),
                                                                    bill_name: billNameStr,
                                                                    billName: billNameStr,
                                                                    isRent: true,
                                                                    simulated_date: getCurrentDate().toISOString()
                                                                }
                                                            },
                                                            ...(includeFacilityInExtension && monthlyFacility > 0 ? [{
                                                                id: existingFacilityId || `facility-ext-${selectedKost.kostId?.substring(0, 8)}`,
                                                                price: monthlyFacility,
                                                                quantity: 1,
                                                                name: (selectedKost.additionalFeeName || `Tagihan Fasilitas (${monthYear})`).substring(0, 50),
                                                                metadata: {
                                                                    original_due_date: targetDate.toISOString(),
                                                                    bill_name: selectedKost.additionalFeeName || `Tagihan air listrik wifi (${monthYear})`,
                                                                    billName: selectedKost.additionalFeeName || `Tagihan air listrik wifi (${monthYear})`,
                                                                    isRent: false,
                                                                    product_type: 'tagihan_ekstra',
                                                                    simulated_date: getCurrentDate().toISOString()
                                                                }
                                                            }] : [])
                                                        ],
                                                        tenantName: user.displayName || user.email?.split('@')[0] || 'Customer',
                                                        propertyTitle: selectedKost.kostName,
                                                        roomCategory: selectedKost.roomType,
                                                        leaseStart: selectedKost.endDate,
                                                        leaseEnd: '-',
                                                        isManualExtension: true,
                                                        simulated_date: getCurrentDate().toISOString()
                                                    });
                                                }}
                                                className="flex-[2] py-4 bg-orange-600 hover:bg-orange-700 text-white font-black uppercase text-[11px] tracking-[0.15em] rounded-2xl shadow-xl shadow-orange-200 transition-all active:scale-95 cursor-pointer"
                                            >
                                                Bayar Perpanjangan
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* TAB 2: RIWAYAT PERPANJANGAN SEBELUMNYA */}
                                {extensionTab === 'history' && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between px-1">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Riwayat Pembayaran & Perpanjangan</span>
                                            <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                                                {extensionHistoryList.length} Transaksi Selesai
                                            </span>
                                        </div>

                                        <div className="space-y-3">
                                            {extensionHistoryList.map((trx: any) => {
                                                const tMeta = typeof trx.metadata === 'string' ? JSON.parse(trx.metadata) : (trx.metadata || {});
                                                const isExt = (trx.product_type || trx.type || '').toLowerCase() === 'perpanjangan_sewa';
                                                const billTitle = tMeta.billName || tMeta.bill_name || (isExt ? `Perpanjangan Sewa (${tMeta.extensionPeriod || 1} Bulan)` : `Sewa Kamar (${trx.period || 'Bulanan'})`);
                                                
                                                return (
                                                    <div key={trx.id} className="p-4 rounded-2xl bg-white border border-gray-150 hover:border-orange-200 shadow-xs transition-all flex flex-col gap-3">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="flex items-start gap-3">
                                                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isExt ? 'bg-orange-50 text-orange-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                                    <Receipt className="w-4 h-4" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs font-black text-gray-900 leading-snug">{billTitle}</p>
                                                                    <p className="text-[10px] text-gray-400 font-bold mt-0.5">
                                                                        {FORMAT_DATE(trx.created_at || trx.updated_at)} • #INV-{trx.id.substring(0, 8).toUpperCase()}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <span className="text-[9px] font-extrabold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full shrink-0">
                                                                Lunas
                                                            </span>
                                                        </div>

                                                        <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
                                                            <div>
                                                                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest block">Total Bayar</span>
                                                                <span className="font-black text-gray-900">{FORMAT_CURRENCY(trx.amount || 0)}</span>
                                                            </div>

                                                            <button
                                                                type="button"
                                                                onClick={() => handleOpenReceiptFromHistory(trx)}
                                                                className="px-3.5 py-1.5 bg-slate-900 hover:bg-black text-white text-[9.5px] font-black uppercase tracking-wider rounded-xl transition-all active:scale-95 shadow-xs flex items-center gap-1.5 cursor-pointer"
                                                            >
                                                                <FileText className="w-3.5 h-3.5 text-orange-400" /> Lihat Kwitansi
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            {extensionHistoryList.length === 0 && (
                                                <div className="p-8 bg-gray-50 rounded-[2rem] border border-gray-100 text-center space-y-2">
                                                    <div className="w-12 h-12 bg-orange-100/70 text-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-2">
                                                        <Calendar className="w-6 h-6" />
                                                    </div>
                                                    <p className="text-xs font-black text-gray-900 uppercase tracking-tight">Belum Ada Riwayat Perpanjangan</p>
                                                    <p className="text-[11px] text-gray-500 max-w-xs mx-auto leading-relaxed">
                                                        Ini adalah periode sewa aktif pertama Anda. Riwayat perpanjangan dan kwitansinya akan otomatis tersimpan di sini.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* 2. Modal Tagihan Tambahan (Invoice Style) */}
            {showExtraBillModal && selectedKost && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-lg my-auto relative shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                        {/* Compact Header */}
                        <div className="bg-[#1a1a1a] p-6 text-white relative shrink-0">
                            <button onClick={() => setShowExtraBillModal(false)} className="absolute top-4 right-4 text-white/50 hover:text-white bg-white/10 rounded-full p-2 transition-colors z-10">
                                <X className="w-5 h-5" />
                            </button>
                            <div className="flex justify-between items-start mt-2">
                                <div className="pr-10">
                                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Nama Properti</p>
                                    <h3 className="text-lg font-black text-white leading-tight mb-0.5">{selectedKost.kostName}</h3>
                                    <p className="text-[10px] text-gray-400 font-medium italic">{selectedKost.roomType || 'Tipe Kamar Standard'}</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">ID Kost</p>
                                    <p className="text-xs font-bold text-gray-300 bg-white/5 px-2 py-1 rounded-lg border border-white/10">{selectedKost.kostId?.substring(0, 8).toUpperCase()}</p>
                                </div>
                            </div>
                        </div>

                        {(() => {
                            // 1. Core Data Normalization
                            const today = getCurrentDate();
                            const rentEnd = parseDateSafely(selectedKost.endDate) || new Date();
                            const moveInDate = parseDateSafely(selectedKost.moveInDate) || new Date();
                            const metadata = selectedKost.metadata || {};

                            const processedExtraBills = (selectedKost.pendingBills || []).map((bill: any) => {
                                const bMeta = bill.metadata || {};
                                const productType = (bill.product_type || bill.type || bMeta.product_type || '').toLowerCase();
                                const billNameLower = (bill.bill_name || bill.name || bMeta.bill_name || bMeta.billName || '').toLowerCase();

                                let displayType = (bill.displayType || (bill.status === 'PAID' ? 'history' : 'active')).toLowerCase();

                                // [FIX] DATE PRIORITY: original_due_date > startDate > dueDate > created_at
                                // NEVER use settlement_date here as it ruins simulation months (forces real-world month)
                                const dueDateRaw = bMeta.original_due_date || bMeta.startDate || bill.dueDate || bill.due_date || bill.created_at;
                                const penalty = Number(bill.penalty || 0);
                                const total = Number(bill.total || bill.amount || 0);

                                const isRentBill = (bMeta.isRent !== undefined) ? bMeta.isRent : (
                                    ['rent', 'kost_booking', 'perpanjangan_sewa', 'kost'].includes(productType) ||
                                    billNameLower.includes('sewa') ||
                                    billNameLower.includes('rent')
                                );

                                const rawMeta = bill.metadata || {};
                                const metadataItem = typeof rawMeta === 'string' ? JSON.parse(rawMeta) : rawMeta;
                                const rawBillName = bill.bill_name || bill.name || metadataItem.bill_name || metadataItem.billName || '';
                                let bill_name = rawBillName;

                                const dueDate = parseDateSafely(metadataItem.original_due_date || bill.dueDate || bill.due_date || bill.created_at);

                                // [FIX] Robust Label Normalization for History & Active
                                if (displayType === 'history') {
                                    const isBatch = metadataItem.is_batch_split_child || metadataItem.is_batch_split_parent;
                                    const isActuallyFacility = rawBillName.toLowerCase().includes('air') ||
                                        rawBillName.toLowerCase().includes('listrik') ||
                                        rawBillName.toLowerCase().includes('wifi') ||
                                        rawBillName.toLowerCase().includes('tagihan') ||
                                        rawBillName.toLowerCase().includes('fasilitas');

                                    const hasCustomDuration = rawBillName.toLowerCase().includes('bulan');

                                    const metaSimDate = metadataItem.simulated_date || metadata.simulated_date;
                                    const dueDateRaw = metadataItem.original_due_date || 
                                                     metadataItem.startDate || 
                                                     bill.dueDate || 
                                                     bill.due_date || 
                                                     metaSimDate ||
                                                     bill.created_at;

                                    const dueDate = parseDateSafely(dueDateRaw);

                                    if (hasCustomDuration) {
                                        // PRESERVE Custom Extension Name (e.g., "Sewa Kost 2 Bulan")
                                        bill_name = metadataItem.bill_name || metadataItem.billName || rawBillName;
                                    } else if (dueDate) {
                                        const monthStr = dueDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
                                        
                                        // [FIX] If the name already has a month (e.g. "Juli 2026"), keep it instead of re-generating
                                        const hasMonthYear = rawBillName.match(/(Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)\s+\d{4}/i);
                                        
                                        if (isActuallyFacility) {
                                            bill_name = hasMonthYear ? rawBillName : `Tagihan air listrik wifi (${monthStr})`;
                                        } else if (isRentBill || rawBillName.toLowerCase().includes('sewa') || rawBillName.toLowerCase().includes('booking')) {
                                            if (!hasCustomDuration && !rawBillName.toLowerCase().includes('bulan')) {
                                                bill_name = hasMonthYear ? rawBillName : `Sewa Kost ${monthStr}`;
                                            } else {
                                                bill_name = rawBillName;
                                            }
                                        }
                                    } else if (isBatch && (metadataItem.bill_name || metadataItem.billName)) {
                                        bill_name = metadataItem.bill_name || metadataItem.billName;
                                    }
                                }

                                return {
                                    ...bill,
                                    bill_name,
                                    penalty,
                                    total,
                                    displayType,
                                    dueDate: new Date(dueDateRaw),
                                    isRent: isRentBill
                                };
                            }).filter((bill: any) => {
                                if (metadata?.paidBills?.includes(bill.id)) return false;

                                const billDate = new Date(bill.dueDate || bill.created_at);
                                if (!isNaN(billDate.getTime())) {
                                    // 1. BOOKING PROTECTION: Hide any bill in the booking month that isn't already history
                                    if (!isNaN(moveInDate.getTime()) && billDate <= moveInDate && bill.displayType !== 'history') return false;

                                    // 2. RENT COVERAGE PROTECTION: Hide rent bills already covered by rentEnd
                                    if (!isNaN(rentEnd.getTime()) && billDate < rentEnd && bill.displayType !== 'history' && bill.isRent) return false;
                                }
                                return true;
                            });

                            // 3. Virtual Rent Bill Generation
                            const period = selectedKost.period?.toLowerCase() || 'bulanan';
                            const meta = selectedKost.metadata || {};
                            const normalizedPeriod = period.includes('3') ? '3bulanan' :
                                period.includes('6') ? '6bulanan' :
                                    period.includes('tahun') ? 'tahunan' : 'bulanan';

                            const monthsPerCycle = normalizedPeriod === 'bulanan' ? 1 :
                                (normalizedPeriod === '3bulanan' ? 3 :
                                    (normalizedPeriod === '6bulanan' ? 6 : 12));

                            const occupantsCount = Number(meta.occupants || meta.occupantsCount || meta.composition?.occupants || selectedKost.occupants || 1);

                            let bp = Number(meta.basePrice || selectedKost.basePrice || 0);
                            let ep = Number(meta.extraPersonFee || meta.extra_person_fee || meta.additionalCostPerPerson || 0);

                            // AUTO-CORRECTION: Jika total harga lebih besar dari harga dasar, berarti ada biaya tambahan (misal extra person)
                            // Ini mencegah tagihan 400k muncul kembali jika user sudah membayar 450k.
                            if (selectedKost.totalPrice > bp && ep === 0) {
                                ep = selectedKost.totalPrice - bp;
                            }

                            if (!bp && selectedKost.totalPrice > 0) {
                                const perMonthTotal = (Number(selectedKost.totalPrice || 0) / Number(selectedKost.duration || 1));
                                bp = Math.max(0, perMonthTotal - ep);
                                if (bp === 0) bp = perMonthTotal;
                            }

                            const combinedRentTotal = (bp + ep) * monthsPerCycle;
                            const daysRemaining = calculateDaysRemaining(selectedKost.endDate);
                            const isRentDueSoon = daysRemaining <= 7;
                            const isRentPaidForCurrentPeriod = processedExtraBills.some((b: any) => {
                                // SMART MATCH: Check if bill name contains the target month and year
                                const billName = (b.bill_name || '').toLowerCase();
                                const isBillRent = (b.isRent === true || billName.includes('sewa') || billName.includes('rent')) && !billName.includes('fasilitas');

                                if (!isBillRent || b.displayType !== 'history') return false;

                                const monthMap: any = { 'january': 'januari', 'february': 'februari', 'march': 'maret', 'may': 'mei', 'june': 'juni', 'juli': 'juli', 'august': 'agustus', 'october': 'oktober', 'december': 'desember' };
                                const targetMonthName = rentEnd.toLocaleDateString('id-ID', { month: 'long' }).toLowerCase();
                                const targetMonthEn = Object.keys(monthMap).find(key => monthMap[key] === targetMonthName) || targetMonthName;
                                const targetYear = rentEnd.getFullYear().toString();

                                const isNameMatch = (billName.includes(targetMonthName) || billName.includes(targetMonthEn)) && billName.includes(targetYear);
                                const bDate = parseDateSafely(b.dueDate || b.created_at);
                                const isDateMatch = bDate && bDate.getMonth() === rentEnd.getMonth() && bDate.getFullYear() === rentEnd.getFullYear();

                                return isNameMatch || isDateMatch;
                            });

                            const hasActiveRentBill = processedExtraBills.some((b: any) => b.isRent && b.displayType === 'active');

                            // Generate Virtual Rent Bill ONLY if not already paid and not already showing an active one
                            const virtualRentItems = (hasActiveRentBill || isRentPaidForCurrentPeriod) ? [] : [{
                                id: 'v-rent-main',
                                bill_name: `Sewa Kost ${rentEnd.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })} (${monthsPerCycle} Bulan)`,
                                amount: combinedRentTotal,
                                displayType: isRentDueSoon ? 'active' : 'upcoming',
                                isRent: true,
                                penalty: 0,
                                total: combinedRentTotal,
                                dateLabel: `Jatuh Tempo: ${rentEnd.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`,
                                created_at: rentEnd.toISOString()
                            }];

                            // [CRITICAL] Merge virtual rent items into the main bill list so facilities can see them
                            processedExtraBills.push(...virtualRentItems);

                            // 4. Virtual Facility Bills (Monthly Stacking based on Time)
                            if (selectedKost.additionalFeePrice > 0 && !isNaN(moveInDate.getTime())) {
                                const start = new Date(moveInDate);
                                const todaySim = getCurrentDate();

                                // [FIX] Generous Horizon: Rent End + 60 days to ensure next facility always shows
                                const horizonDate = new Date(Math.max(
                                    rentEnd ? (rentEnd.getTime() + (60 * 24 * 60 * 60 * 1000)) : 0,
                                    todaySim.getTime() + (45 * 24 * 60 * 60 * 1000)
                                ));

                                // [CRITICAL] PRE-CALCULATE: Find the earliest unpaid rent month/year BEFORE the loop
                                const unpaidRentBills = processedExtraBills.filter(b => b.isRent && b.displayType !== 'history');
                                let earliestUnpaidRentMonthValue = 999999; // Infinity default

                                if (unpaidRentBills.length > 0) {
                                    const earliestUnpaidDate = unpaidRentBills.reduce((earliest, current) => {
                                        const d1 = new Date(earliest.dueDate || earliest.created_at);
                                        const d2 = new Date(current.dueDate || current.created_at);
                                        return d1 < d2 ? earliest : current;
                                    });
                                    const d = new Date(earliestUnpaidDate.dueDate || earliestUnpaidDate.created_at);
                                    earliestUnpaidRentMonthValue = d.getFullYear() * 12 + d.getMonth();
                                }

                                const penaltyPerDay = 2000;
                                const gracePeriod = 7;
                                const usedPendingIds = new Set<string>();

                                // [FIX] Hitung tagihan fasilitas mendatang yang sudah ada di DB (bukan virtual)
                                // Tujuan: max 1 tagihan mendatang (upcoming) fasilitas yang tampil sekaligus.
                                const existingDbUpcomingFacilityCount = processedExtraBills.filter(
                                    (b: any) => !b.isRent && b.displayType === 'upcoming'
                                ).length;
                                const maxVirtualUpcomingFacility = Math.max(0, 1 - existingDbUpcomingFacilityCount);
                                let virtualUpcomingFacilityCount = 0;

                                // Run loop for a generous range, but break based on horizonDate
                                for (let i = 1; i <= 100; i++) {
                                    const currentBillDate = new Date(start);
                                    currentBillDate.setMonth(start.getMonth() + i);

                                    const billTime = new Date(currentBillDate.getFullYear(), currentBillDate.getMonth(), currentBillDate.getDate()).getTime();
                                    if (billTime > horizonDate.getTime()) break;

                                    const isBookingMonth = currentBillDate.getMonth() === moveInDate.getMonth() &&
                                        currentBillDate.getFullYear() === moveInDate.getFullYear();

                                    if (isBookingMonth) continue;

                                    const daysRemaining = calculateDaysRemaining(currentBillDate.toISOString());
                                    const isActive = daysRemaining <= 7;

                                    const isFacilityPaid = processedExtraBills.some((b: any) => {
                                        const rawMeta = b.metadata || {};
                                        const bMeta = typeof rawMeta === 'string' ? JSON.parse(rawMeta) : rawMeta;
                                        const billName = (b.bill_name || b.name || bMeta.bill_name || bMeta.billName || '').toLowerCase();
                                        const isBillRent = (bMeta.isRent !== undefined) ? bMeta.isRent : (
                                            (b.isRent === true || billName.includes('sewa') || billName.includes('rent')) &&
                                            !billName.includes('fasilitas') &&
                                            !billName.includes('air') &&
                                            !billName.includes('listrik') &&
                                            !billName.includes('wifi') &&
                                            !billName.includes('tagihan') &&
                                            // [SAFETY] If amount matches exactly monthlyFacility and it's mislabeled as 'sewa', it's likely a facility bill
                                            !(Math.abs(Number(b.amount || 0) - (selectedKost.additionalFeePrice || 0)) < 100 && (billName.includes('sewa') || billName.includes('rent')))
                                        );
                                        const isBundle = billName.includes('total') || billName.includes('semua') || bMeta.is_batch_split_child || bMeta.is_batch_split_parent;

                                        if (isBillRent && !isBundle && b.displayType === 'history') return false;
                                        if (b.displayType !== 'history') return false;
                                        if (usedPendingIds.has(b.id)) return false;

                                        // [FIX] ROBUST DATE MATCHING: Check name if metadata is missing/mismatched
                                        const billDate = parseDateSafely(bMeta.original_due_date || b.dueDate || b.due_date || b.created_at);
                                        let isSameMonth = billDate && billDate.getMonth() === currentBillDate.getMonth() &&
                                            billDate.getFullYear() === currentBillDate.getFullYear();

                                        // [NEW] NAME-BASED FALLBACK: If date doesn't match, check if the month name is in the bill name
                                        if (!isSameMonth) {
                                            const monthMap: any = { 'januari': 0, 'februari': 1, 'maret': 2, 'april': 3, 'mei': 4, 'juni': 5, 'juli': 6, 'agustus': 7, 'september': 8, 'oktober': 9, 'november': 10, 'desember': 11, 'january': 0, 'february': 1, 'march': 2, 'may': 4, 'june': 5, 'july': 6, 'august': 7, 'october': 9, 'december': 11 };
                                            const targetYear = currentBillDate.getFullYear();
                                            const targetMonthIdx = currentBillDate.getMonth();
                                            
                                            // Extract year and month name from billName
                                            const yearMatch = billName.match(/\d{4}/);
                                            const nameMonthMatch = billName.match(/(januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember|january|february|march|may|june|july|august|september|october|november|december)/i);
                                            
                                            if (yearMatch && nameMonthMatch) {
                                                const bYear = parseInt(yearMatch[0]);
                                                const bMonthIdx = monthMap[nameMonthMatch[0].toLowerCase()];
                                                if (bYear === targetYear && bMonthIdx === targetMonthIdx) {
                                                    isSameMonth = true;
                                                }
                                            }
                                        }

                                        if (isSameMonth) {
                                            usedPendingIds.add(b.id);
                                            return true;
                                        }
                                        return false;

                                    });

                                    // [FIX] BUNDLED PAYMENT CHECK:
                                    // If a bundled parent (is_bundled_parent=true) was paid for this same month,
                                    // the facility is also considered paid — even if the child record has wrong dates.
                                    const hasBundledPaymentForMonth = !isFacilityPaid && processedExtraBills.some((b: any) => {
                                        if (b.displayType !== 'history') return false;
                                        const rawMeta = b.metadata || {};
                                        const bMeta = typeof rawMeta === 'string' ? JSON.parse(rawMeta) : rawMeta;
                                        if (!bMeta.is_bundled_parent) return false;

                                        // Check by original_due_date or simulated_date
                                        const bDate = parseDateSafely(bMeta.original_due_date || bMeta.simulated_date || b.created_at);
                                        if (bDate && bDate.getMonth() === currentBillDate.getMonth() && bDate.getFullYear() === currentBillDate.getFullYear()) {
                                            return true;
                                        }
                                        // Fallback: check month name in bill_name
                                        const bName = (b.bill_name || bMeta.bill_name || '').toLowerCase();
                                        const monthMap: any = { 'januari': 0, 'februari': 1, 'maret': 2, 'april': 3, 'mei': 4, 'juni': 5, 'juli': 6, 'agustus': 7, 'september': 8, 'oktober': 9, 'november': 10, 'desember': 11 };
                                        const yearMatch = bName.match(/\d{4}/);
                                        const nameMonthMatch = bName.match(/(januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember)/i);
                                        if (yearMatch && nameMonthMatch) {
                                            const bYear = parseInt(yearMatch[0]);
                                            const bMonthIdx = monthMap[nameMonthMatch[0].toLowerCase()];
                                            if (bYear === currentBillDate.getFullYear() && bMonthIdx === currentBillDate.getMonth()) return true;
                                        }
                                        return false;
                                    });

                                    const isFacilityEffectivelyPaid = isFacilityPaid || hasBundledPaymentForMonth;

                                    if (!isFacilityEffectivelyPaid && !isBookingMonth) {
                                        // [FIX] RELAXED GATEKEEPER:
                                        // Show if: 1. This facility month is already paid for rent (history)
                                        // OR 2. This is the current/next month we are expected to pay rent for
                                        // OR 3. There are NO more unpaid rent bills (contract end)
                                        const currentFacilityMonthValue = currentBillDate.getFullYear() * 12 + currentBillDate.getMonth();
                                        const isRentPaidForThisMonth = processedExtraBills.some(b => {
                                            if (!b.isRent || b.displayType !== 'history') return false;
                                            const bDate = parseDateSafely(b.dueDate || b.created_at);
                                            return bDate && bDate.getMonth() === currentBillDate.getMonth() && bDate.getFullYear() === currentBillDate.getFullYear();
                                        });

                                        if (!isRentPaidForThisMonth && currentFacilityMonthValue > earliestUnpaidRentMonthValue) {
                                            continue;
                                        }

                                        // [FIX] MAX 1 UPCOMING: Jika tagihan ini 'upcoming' (bukan aktif),
                                        // hentikan loop setelah 1 upcoming virtual ditambahkan.
                                        if (!isActive) {
                                            if (virtualUpcomingFacilityCount >= maxVirtualUpcomingFacility) {
                                                break; // Stop — sudah ada 1 tagihan mendatang
                                            }
                                            virtualUpcomingFacilityCount++;
                                        }

                                        let penalty = 0;
                                        if (daysRemaining < -gracePeriod) {
                                            const daysOverdue = Math.abs(daysRemaining) - gracePeriod;
                                            penalty = daysOverdue * penaltyPerDay;
                                        }

                                        processedExtraBills.push({
                                            id: `v-fac-${i}`,
                                            bill_name: `Tagihan ${selectedKost.additionalFeeName || 'Fasilitas'} (${currentBillDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })})`,
                                            amount: selectedKost.additionalFeePrice,
                                            displayType: isActive ? 'active' : 'upcoming',
                                            isRent: false,
                                            penalty: penalty,
                                            total: Number(selectedKost.additionalFeePrice || 0) + penalty,
                                            created_at: currentBillDate.toISOString(),
                                            dueDate: currentBillDate,
                                            dateLabel: `Jatuh Tempo: ${currentBillDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`
                                        } as any);
                                    }
                                }
                            }

                            // 5. Aggregate, Sort and Deduplicate History
                            const rawItems = [...processedExtraBills].sort((a: any, b: any) => {
                                const order: any = { 'active': 0, 'upcoming': 1, 'history': 2 };
                                const typeA = a.displayType || 'active';
                                const typeB = b.displayType || 'active';
                                if (order[typeA] !== order[typeB]) return order[typeA] - order[typeB];
                                const dateA = new Date(a.dueDate || a.created_at);
                                const dateB = new Date(b.dueDate || b.created_at);
                                const timeA = dateA.getTime();
                                const timeB = dateB.getTime();

                                const createdA = new Date(a.created_at || a.dueDate).getTime();
                                const createdB = new Date(b.created_at || b.dueDate).getTime();

                                if (typeA === 'history') {
                                    // [FIX] Urutkan riwayat mutlak berdasarkan waktu transaksi terjadi (newest first)
                                    if (createdA !== createdB) {
                                        return createdB - createdA;
                                    }
                                    // Jika waktu bayar sama persis (misal via Batch Split), urutkan berdasarkan bulan jatuh temponya (terbaru di atas)
                                    const timeA = new Date(a.dueDate || a.created_at).getTime();
                                    const timeB = new Date(b.dueDate || b.created_at).getTime();
                                    return timeB - timeA;
                                }

                                // Untuk tagihan aktif/mendatang, urutkan berdasarkan jatuh tempo terdekat
                                return timeA - timeB;
                            });

                            const historyMap = new Map();
                            const finalItems = rawItems.filter((item: any) => {
                                if (item.displayType !== 'history') return true;

                                // [FIX] Show PAID items even if hidden_from_history is true (compatibility for old data)
                                const itemMeta = item.metadata || {};
                                const itemStatus = (item.status || '').toLowerCase();
                                const isPaid = ['paid', 'success', 'berhasil', 'settlement', 'capture', 'completed', 'done'].includes(itemStatus);
                                if ((itemMeta.hidden_from_history === true || itemMeta.hidden_from_history === 'true') && !isPaid) return false;

                                // TAMPILKAN APA ADANYA DARI DATABASE (Hanya hindari duplikat ID transaksi yang sama)
                                const uniqueId = item.id || Math.random().toString();
                                if (historyMap.has(uniqueId)) {
                                    return false;
                                }
                                historyMap.set(uniqueId, item);
                                return true;
                            });

                            const grandTotalActive = finalItems
                                .filter((item: any) => item.displayType === 'active')
                                .reduce((sum: number, item: any) => sum + (item.total || 0), 0);

                            const activeRentTotal = finalItems
                                .filter((item: any) => item.isRent && item.displayType === 'active')
                                .reduce((sum: number, item: any) => sum + (item.total || 0), 0);

                            const activeExtraTotal = finalItems
                                .filter((item: any) => !item.isRent && item.displayType === 'active')
                                .reduce((sum: number, item: any) => sum + (item.total || 0), 0);

                            return (
                                <div className="flex flex-col flex-1 min-h-0">
                                    <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50 custom-scrollbar">
                                        <div className="flex justify-between items-center mb-4">
                                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-2">Daftar Tagihan</h4>
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border border-gray-100 shadow-sm">
                                                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
                                                    <span className="text-[9px] font-bold text-gray-500 uppercase">Simulator: {getCurrentDate().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                </div>
                                                {getMockDateStr() && (
                                                    <button
                                                        onClick={() => setMockDate(null)}
                                                        className="bg-red-50 text-red-600 px-2 py-1 rounded-lg text-[8px] font-black uppercase border border-red-100 hover:bg-red-600 hover:text-white transition-all"
                                                    >
                                                        Reset
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            {finalItems.map((item: any, idx: number) => {
                                                const isActive = item.displayType === 'active';
                                                const isHistory = item.displayType === 'history';
                                                const textColor = isHistory ? 'text-gray-400' : isActive ? 'text-emerald-600' : 'text-blue-600';
                                                const bgColor = isHistory ? 'bg-white' : isActive ? 'bg-emerald-50' : 'bg-blue-50';

                                                return (
                                                    <div key={item.id || idx} className={`${bgColor} border border-gray-100 rounded-3xl p-5 transition-all relative overflow-hidden group shadow-sm`}>
                                                        <div className="flex justify-between items-start gap-3">
                                                            <div className="flex gap-3 min-w-0">
                                                                <div className="w-9 h-9 shrink-0 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                                                                    <Receipt className={`w-4 h-4 ${textColor}`} />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className={`text-[8px] font-black uppercase tracking-widest ${textColor} mb-1`}>
                                                                        {isHistory ? 'LUNAS' : isActive ? 'TAGIHAN AKTIF' : 'TAGIHAN MENDATANG'}
                                                                    </p>
                                                                    <h5 className="text-[11px] font-black text-gray-900 leading-tight truncate">{item.bill_name}</h5>
                                                                    <p className="text-[8px] text-gray-500 font-bold mt-1">{item.dateLabel}</p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right flex flex-col items-end gap-2">
                                                                <div>
                                                                    <p className="text-sm font-black text-gray-900">{FORMAT_CURRENCY(item.total)}</p>
                                                                    {item.penalty > 0 && <p className="text-[7px] text-red-500 font-black uppercase">+ Denda {FORMAT_CURRENCY(item.penalty)}</p>}
                                                                </div>
                                                                {isActive && (
                                                                    <button
                                                                        onClick={() => {
                                                                            handleStartPayment(item.total, selectedKost.kostId, item.isRent ? 'perpanjangan_sewa' : 'tagihan_ekstra', {
                                                                                billPayment: true,
                                                                                billId: item.id,
                                                                                billName: item.bill_name,
                                                                                isRent: !!item.isRent,
                                                                                pendingBills: [item],
                                                                                item_details: [{
                                                                                    id: (item.id || 'bill').substring(0, 50),
                                                                                    price: item.total,
                                                                                    quantity: 1,
                                                                                    name: (item.bill_name || 'Tagihan Kost').substring(0, 50),
                                                                                    metadata: {
                                                                                        original_due_date: item.dueDate || item.due_date || item.created_at,
                                                                                        bill_name: item.bill_name,
                                                                                        isRent: !!item.isRent
                                                                                    }
                                                                                }],
                                                                                resident_status_id: selectedKost.id,
                                                                                simulated_date: getCurrentDate().toISOString(),
                                                                                extensionPeriod: item.isRent ? monthsPerCycle : undefined,
                                                                                masa_sewa_hari: item.isRent ? (monthsPerCycle * 30) : 0,
                                                                                kostName: selectedKost.kostName,
                                                                                composition: item.isRent ? {
                                                                                    baseRent: bp * monthsPerCycle,
                                                                                    extraPersonFee: ep * monthsPerCycle,
                                                                                    facilityFee: 0
                                                                                } : {
                                                                                    baseRent: 0,
                                                                                    extraPersonFee: 0,
                                                                                    facilityFee: item.total
                                                                                }
                                                                            });
                                                                        }}
                                                                        className="px-4 py-2 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-700 transition-all active:scale-95 shadow-sm cursor-pointer"
                                                                    >
                                                                        Bayar
                                                                    </button>
                                                                )}
                                                                {isHistory && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setSelectedReceipt({
                                                                                receiptNumber: item.id || `INV-${Date.now()}`,
                                                                                paidAt: item.created_at || item.updated_at || new Date().toISOString(),
                                                                                tenantName: user?.displayName || user?.name || 'Penghuni Kost',
                                                                                tenantPhone: user?.phoneNumber || user?.phone || '',
                                                                                propertyTitle: selectedKost.kostName,
                                                                                roomNumber: selectedKost.roomType || '1',
                                                                                billingPeriod: selectedKost.period || 'Bulanan',
                                                                                newPeriodStart: item.dueDate || selectedKost.startDate,
                                                                                newPeriodEnd: selectedKost.endDate,
                                                                                baseRent: Number(item.total || selectedKost.totalPrice || 0),
                                                                                extraFee: Number(item.penalty || 0),
                                                                                extraFeeName: item.penalty > 0 ? 'Denda Keterlambatan' : undefined,
                                                                                totalAmount: Number(item.total || 0),
                                                                                paymentMethod: 'Payment Gateway / QRIS'
                                                                            });
                                                                            setShowDigitalReceiptModal(true);
                                                                        }}
                                                                        className="px-3.5 py-1.5 bg-slate-900 text-white text-[9px] font-black uppercase tracking-wider rounded-xl hover:bg-black transition-all active:scale-95 shadow-sm flex items-center gap-1 cursor-pointer"
                                                                    >
                                                                        <FileText className="w-3 h-3" /> Kwitansi
                                                                    </button>
                                                                )}

                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {finalItems.length === 0 && (
                                                <div className="text-center py-12">
                                                    <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                                        <CheckCircle className="w-8 h-8 text-emerald-500" />
                                                    </div>
                                                    <p className="text-sm font-bold text-gray-900">Semua Tagihan Lunas</p>
                                                    <p className="text-[10px] text-gray-400 font-medium">Tidak ada tagihan aktif untuk saat ini.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {grandTotalActive > 0 && (
                                        <div className="p-8 bg-white border-t border-gray-100 flex items-center justify-between shrink-0">
                                            <div>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Pembayaran</p>
                                                <p className="text-2xl font-black text-gray-900">{FORMAT_CURRENCY(grandTotalActive)}</p>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    const activeItems = finalItems.filter((i: any) => i.displayType === 'active');
                                                    const hasRent = activeItems.some((i: any) => i.isRent);
                                                    const rentActiveItem = activeItems.find((i: any) => i.isRent);
                                                    handleStartPayment(grandTotalActive, selectedKost.kostId, hasRent ? 'perpanjangan_sewa' : 'tagihan_ekstra', {
                                                        billPayment: true,
                                                        billId: 'bulk-payment',
                                                        masa_sewa_hari: hasRent ? (monthsPerCycle * 30) : 0,
                                                        pendingBills: activeItems,
                                                        // [FIX] Pass bill_name and original_due_date so backend stores simulated month
                                                        bill_name: rentActiveItem?.bill_name,
                                                        billName: rentActiveItem?.bill_name,
                                                        original_due_date: rentActiveItem?.dueDate?.toISOString?.() || rentActiveItem?.created_at,
                                                        item_details: activeItems.map((i: any) => ({
                                                            id: (i.id || 'bill').substring(0, 50),
                                                            bill_id: i.id,
                                                            price: i.total,
                                                            quantity: 1,
                                                            name: (i.bill_name || 'Tagihan Kost').substring(0, 50),
                                                            metadata: {
                                                                original_due_date: i.dueDate?.toISOString?.() || i.due_date || i.created_at,
                                                                bill_name: i.bill_name,
                                                                isRent: !!i.isRent
                                                            }
                                                        })),
                                                        resident_status_id: selectedKost.id,
                                                        extensionPeriod: hasRent ? monthsPerCycle : undefined,
                                                        kostName: selectedKost.kostName,
                                                        composition: {
                                                            baseRent: bp * monthsPerCycle,
                                                            extraPersonFee: ep * monthsPerCycle,
                                                            facilityFee: activeExtraTotal
                                                        },
                                                        booking_session_id: meta.booking_session_id || selectedKost.metadata?.booking_session_id,
                                                        simulated_date: getCurrentDate().toISOString()
                                                    });
                                                }}
                                                className="h-10 px-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-[12px] uppercase tracking-[0.1em] whitespace-nowrap shadow-lg shadow-emerald-500/10 transition-all active:scale-95 flex items-center justify-center"
                                            >
                                                Bayar Semua
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </div>
                </div>
            )}



            {/* 3. Modal Komplain Modern & Terstruktur */}
            {showComplaintModal && selectedKost && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-md overflow-y-auto">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-xl my-auto relative shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100 max-h-[92vh] flex flex-col">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 p-6 text-white relative">
                            <button 
                                onClick={() => setShowComplaintModal(false)} 
                                className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/20 hover:bg-black/30 rounded-full p-2.5 transition-all active:scale-95"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            <div className="flex items-center gap-3.5 mb-2">
                                <div className="w-11 h-11 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-inner">
                                    <MessageSquare className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black tracking-tight">Layanan Tiket Kendala & Perbaikan</h3>
                                    <p className="text-red-100 text-xs font-medium">{selectedKost.kostName || selectedKost.name} &bull; Kamar {selectedKost.roomNumber || selectedKost.room_number || selectedKost.roomType || '-'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Form Body */}
                        <form onSubmit={submitComplaint} className="p-6 md:p-8 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
                            {/* Kategori Kendala */}
                            <div>
                                <label className="text-[11px] font-black text-gray-500 uppercase tracking-wider block mb-2">
                                    Kategori Fasilitas / Masalah
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {[
                                        { label: 'AC & Ventilasi', icon: '❄️' },
                                        { label: 'Pipa & Sanitasi', icon: '🚿' },
                                        { label: 'Listrik & Lampu', icon: '💡' },
                                        { label: 'Furnitur & Kasur', icon: '🛏️' },
                                        { label: 'WiFi & Internet', icon: '📶' },
                                        { label: 'Kebersihan', icon: '🧹' },
                                        { label: 'Kunci & Keamanan', icon: '🚪' },
                                        { label: 'Lainnya', icon: '❓' }
                                    ].map((cat) => (
                                        <button
                                            key={cat.label}
                                            type="button"
                                            onClick={() => setComplaintCategory(cat.label)}
                                            className={`p-2.5 rounded-2xl border text-left flex flex-col items-center justify-center gap-1 transition-all ${
                                                complaintCategory === cat.label
                                                    ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-sm ring-2 ring-rose-500/20 font-black'
                                                    : 'bg-gray-50 border-gray-200/80 text-gray-600 hover:bg-gray-100 font-bold'
                                            }`}
                                        >
                                            <span className="text-lg">{cat.icon}</span>
                                            <span className="text-[10px] leading-tight text-center">{cat.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Tingkat Urgensi */}
                            <div>
                                <label className="text-[11px] font-black text-gray-500 uppercase tracking-wider block mb-2">
                                    Tingkat Kepentingan (Urgensi)
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setComplaintUrgency('NORMAL')}
                                        className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                                            complaintUrgency === 'NORMAL'
                                                ? 'bg-blue-50 border-blue-500 text-blue-800 shadow-sm ring-2 ring-blue-500/20'
                                                : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                                        }`}
                                    >
                                        <div className={`w-3.5 h-3.5 rounded-full ${complaintUrgency === 'NORMAL' ? 'bg-blue-600' : 'bg-gray-300'}`} />
                                        <div>
                                            <p className="text-xs font-black">Standar (Normal)</p>
                                            <p className="text-[10px] text-gray-500">Penanganan berkala 1-2 hari</p>
                                        </div>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setComplaintUrgency('EMERGENCY')}
                                        className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                                            complaintUrgency === 'EMERGENCY'
                                                ? 'bg-rose-50 border-rose-500 text-rose-800 shadow-sm ring-2 ring-rose-500/20'
                                                : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                                        }`}
                                    >
                                        <div className={`w-3.5 h-3.5 rounded-full ${complaintUrgency === 'EMERGENCY' ? 'bg-rose-600 animate-pulse' : 'bg-gray-300'}`} />
                                        <div>
                                            <p className="text-xs font-black text-rose-700">🚨 Darurat (Urgent)</p>
                                            <p className="text-[10px] text-rose-600 font-medium">Air mati total / korsleting</p>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* Judul Kendala */}
                            <div>
                                <label className="text-[11px] font-black text-gray-500 uppercase tracking-wider block mb-1.5">
                                    Pokok Kendala
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={complaintTitle}
                                    onChange={(e) => setComplaintTitle(e.target.value)}
                                    placeholder="Contoh: AC Kamar Menetes atau Lampu Kamar Mati"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold text-gray-800 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all placeholder:text-gray-400 placeholder:font-normal"
                                />
                            </div>

                            {/* Detail Masalah */}
                            <div>
                                <label className="text-[11px] font-black text-gray-500 uppercase tracking-wider block mb-1.5">
                                    Deskripsi & Lokasi Kerusakan
                                </label>
                                <textarea
                                    rows={3}
                                    required
                                    value={complaintDesc}
                                    onChange={(e) => setComplaintDesc(e.target.value)}
                                    placeholder="Jelaskan secara rinci kondisi kerusakan, sejak kapan terjadi, atau kapan teknisi boleh masuk..."
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium text-gray-800 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none resize-none transition-all placeholder:text-gray-400"
                                ></textarea>
                            </div>

                            {/* Upload Foto */}
                            <div>
                                <label className="text-[11px] font-black text-gray-500 uppercase tracking-wider block mb-1.5">
                                    Foto Bukti Kerusakan (Opsional)
                                </label>
                                {complaintPhotoPreview ? (
                                    <div className="relative rounded-2xl overflow-hidden border border-gray-200 group aspect-video max-h-48 bg-slate-900 flex items-center justify-center">
                                        <img src={complaintPhotoPreview} alt="Preview Bukti" className="w-full h-full object-contain" />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setComplaintPhoto(null);
                                                setComplaintPhotoPreview('');
                                            }}
                                            className="absolute top-2 right-2 bg-rose-600 text-white p-1.5 rounded-full shadow-lg hover:bg-rose-700 transition-all"
                                            title="Hapus foto"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                        <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-bold text-white">
                                            Format WebP Dioptimalkan
                                        </div>
                                    </div>
                                ) : (
                                    <label className="cursor-pointer block">
                                        <div className="flex flex-col items-center justify-center gap-2 p-4 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl hover:border-rose-400 hover:bg-rose-50/50 transition-all text-gray-500 group">
                                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform text-rose-500">
                                                <Camera className="w-5 h-5" />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-xs font-black text-gray-700">Pilih / Ambil Foto Kerusakan</p>
                                                <p className="text-[10px] text-gray-400">JPG, PNG, atau WebP (otomatis dikompresi)</p>
                                            </div>
                                        </div>
                                        <input 
                                            type="file" 
                                            className="hidden" 
                                            accept="image/*" 
                                            onChange={(e) => {
                                                const file = e.target.files?.[0] || null;
                                                setComplaintPhoto(file);
                                                if (file) {
                                                    const url = URL.createObjectURL(file);
                                                    setComplaintPhotoPreview(url);
                                                } else {
                                                    setComplaintPhotoPreview('');
                                                }
                                            }} 
                                        />
                                    </label>
                                )}
                            </div>

                            {/* Tombol Aksi */}
                            <div className="space-y-2 pt-2">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full py-3.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-rose-200 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>Mengirim Laporan...</span>
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="w-4 h-4" />
                                            <span>Kirim Laporan Kendala</span>
                                        </>
                                    )}
                                </button>
                                
                                <button
                                    type="button"
                                    onClick={() => handleReportIssueWhatsApp(selectedKost)}
                                    className="w-full py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-black text-xs uppercase tracking-wider rounded-2xl border border-emerald-200 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                                >
                                    <Phone className="w-4 h-4 text-emerald-600" />
                                    <span>Butuh Cepat? Hubungi Admin via WhatsApp</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 4. Modal Penilaian / Rating */}
            {showRatingModal && selectedKost && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white rounded-3xl w-full max-w-md my-auto relative shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-yellow-500 p-6 text-white text-center">
                            <button onClick={() => setShowRatingModal(false)} className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/10 hover:bg-black/20 rounded-full p-2 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Star className="w-8 h-8 text-white fill-white" />
                            </div>
                            <h3 className="text-xl font-bold">Beri Penilaian Kost</h3>
                            <p className="text-yellow-100 text-sm opacity-90 mt-1">Bagaimana pengalaman Anda tinggal di {selectedKost.kostName}?</p>
                        </div>

                        <form onSubmit={submitRating} className="p-8 space-y-6">
                            <div className="flex flex-col items-center">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Pilih Bintang</label>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setRatingValue(star)}
                                            className="transition-transform active:scale-90"
                                        >
                                            <Star
                                                className={`w-10 h-10 ${star <= ratingValue ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Ulasan Anda</label>
                                <textarea
                                    rows={4}
                                    required
                                    value={ratingComment}
                                    onChange={(e) => setRatingComment(e.target.value)}
                                    placeholder="Ceritakan kelebihan atau kekurangan kost ini untuk membantu calon penyewa lain..."
                                    className="w-full mt-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 outline-none resize-none"
                                ></textarea>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-4 bg-yellow-500 hover:bg-yellow-600 text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-xl shadow-yellow-100 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {isSubmitting ? 'Mengirim...' : 'Kirim Penilaian'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* 4.1 Modal Penilaian Agen Survey */}
            {showSurveyRatingModal && selectedRatingSurvey && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white rounded-3xl w-full max-w-md my-auto relative shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100">
                        <div className="bg-orange-500 p-6 text-white text-center">
                            <button onClick={() => setShowSurveyRatingModal(false)} className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/10 hover:bg-black/20 rounded-full p-2 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md border border-white/30">
                                <Star className="w-8 h-8 text-white fill-white" />
                            </div>
                            <h3 className="text-xl font-black uppercase tracking-tight">Penilaian Agen Survey</h3>
                            <p className="text-orange-100 text-xs font-bold mt-1">Bagaimana kinerja {selectedRatingSurvey.agent_name || 'Petugas'} saat survey di {selectedRatingSurvey.kost_name}?</p>
                        </div>

                        <form onSubmit={submitSurveyRating} className="p-8 space-y-6">
                            <div className="flex flex-col items-center">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Pilih Kepuasan Anda</label>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setSurveyRatingValue(star)}
                                            className="transition-transform active:scale-90"
                                        >
                                            <Star
                                                className={`w-10 h-10 transition-all ${star <= surveyRatingValue ? 'text-yellow-400 fill-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.4)]' : 'text-gray-200 hover:text-gray-300'}`}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Feedback Untuk Agen</label>
                                <textarea
                                    rows={4}
                                    required
                                    value={surveyRatingComment}
                                    onChange={(e) => setSurveyRatingComment(e.target.value)}
                                    placeholder="Tulis ulasan mengenai kesopanan, ketelitian, dan detail laporan yang diberikan oleh agen..."
                                    className="w-full mt-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none resize-none"
                                ></textarea>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-xl shadow-orange-100 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {isSubmitting ? 'Mengirim...' : 'Konfirmasi & Kirim Penilaian'}
                            </button>
                        </form>
                    </div>
                </div>
            )}


            {showChatWindow && activeChatSession && (
                <ChatWindow
                    session={activeChatSession}
                    currentUser={user}
                    onClose={() => setShowChatWindow(false)}
                    propertyName={activeChatSession.propertyName}
                    contactName={activeChatSession.contactName}
                    contactType={activeChatSession.contactType}
                />
            )}

            {/* 5. Payment Gateway Integration */}
            {showPaymentGateway && (
                <PaymentGateway
                    amount={paymentAmount}
                    orderId={paymentOrderId}
                    productId={paymentProductId}
                    productType={paymentProductType}
                    userId={user.uid}
                    isAdmin={user?.role === 'admin'}
                    existingOrderId={(paymentOrderId && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(paymentOrderId)) ? paymentOrderId : undefined}
                    metadata={{
                        ...paymentMetadata,
                        userName: user.name || user.displayName || 'Penyewa',
                        userEmail: user.email,
                        userPhone: user.phoneNumber || user.phone || '',
                        userAddress: user.address || '',
                        timestamp: new Date().toISOString(),
                        productName: selectedKost?.kostName
                    }}
                    onPaymentSuccess={async (paidOrderId?: string) => {
                        const meta = paymentMetadata as any;

                        // 1. Settle virtual/real pending bills in DB
                        if (meta?.billPayment && meta?.pendingBills) {
                            const pendingIds = meta.pendingBills.map((b: any) => b.id);
                            await settlePendingBills(pendingIds);
                        }

                        // 2. Automated WhatsApp Receipt Dispatch
                        const phone = meta?.tenantPhone || meta?.userPhone || user?.phoneNumber || user?.phone || '';
                        const receiptNumber = paidOrderId || paymentOrderId || `INV-${Date.now()}`;
                        
                        if (phone) {
                            sendRentReceiptWhatsApp({
                                phone,
                                tenantName: meta?.tenantName || user?.displayName || user?.name || 'Penghuni Kost',
                                propertyTitle: selectedKost?.kostName || meta?.propertyTitle || 'Kost RuangSinggah',
                                roomNumber: meta?.roomNumber || meta?.roomCategory || selectedKost?.roomType || '1',
                                amount: Number(paymentAmount || 0),
                                paymentMethod: 'Payment Gateway / QRIS',
                                orderId: receiptNumber,
                                paidAt: new Date().toISOString(),
                                billingPeriod: meta?.billingPeriod || `${extensionPeriod || 1} Bulan`,
                                newPeriodStart: meta?.newPeriodStart || meta?.startDate,
                                newPeriodEnd: meta?.newPeriodEnd || meta?.endDate,
                                extraFee: meta?.extraFee,
                                extraFeeName: meta?.extraFeeName,
                                basePrice: meta?.basePrice || meta?.baseRent
                            }).catch(e => console.warn('WA Receipt dispatch error:', e));
                        }

                        setShowPaymentGateway(false);

                        // 3. Set Receipt Data and Open Digital Receipt Modal
                        setSelectedReceipt({
                            receiptNumber,
                            paidAt: new Date().toISOString(),
                            tenantName: meta?.tenantName || user?.displayName || user?.name || 'Penghuni Kost',
                            tenantPhone: phone,
                            propertyTitle: selectedKost?.kostName || meta?.propertyTitle || 'Kost RuangSinggah',
                            roomNumber: meta?.roomNumber || meta?.roomCategory || selectedKost?.roomType || '1',
                            billingPeriod: meta?.billingPeriod || `${extensionPeriod || 1} Bulan`,
                            newPeriodStart: meta?.newPeriodStart || meta?.startDate,
                            newPeriodEnd: meta?.newPeriodEnd || meta?.endDate,
                            baseRent: Number(meta?.basePrice || meta?.baseRent || paymentAmount),
                            extraFee: Number(meta?.extraFee || 0),
                            extraFeeName: meta?.extraFeeName,
                            totalAmount: Number(paymentAmount || 0),
                            paymentMethod: 'Payment Gateway / QRIS'
                        });
                        setShowDigitalReceiptModal(true);

                        fetchMyKosts();
                    }}
                    onCancel={() => setShowPaymentGateway(false)}
                />
            )}


            {/* 6. Modal Summary Survey */}
            {showSurveySummaryModal && selectedSurvey && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-2xl my-auto relative shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="bg-gray-900 p-8 text-white relative flex-shrink-0">
                            <button onClick={() => setShowSurveySummaryModal(false)} className="absolute top-6 right-6 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                            <div className="flex items-center gap-4 mb-2">
                                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                                    <FileText className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-black text-white/50 uppercase tracking-[0.3em] mb-1">Hasil Survey Lokasi</h4>
                                    <h3 className="text-2xl font-black">{selectedSurvey.kost_name}</h3>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-8 overflow-y-auto custom-scrollbar bg-gray-50/50 flex-grow">
                            {/* WhatsApp Evidence Section */}
                            {selectedSurvey.evaluation_summary?.whatsapp_evidence_url && (
                                <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm mb-8 flex flex-col sm:flex-row items-center gap-6">
                                    <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gray-50 rounded-[2rem] border border-gray-200 overflow-hidden shrink-0 group relative cursor-pointer" onClick={() => window.open(Array.isArray(selectedSurvey.evaluation_summary.whatsapp_evidence_url) ? selectedSurvey.evaluation_summary.whatsapp_evidence_url[0] : selectedSurvey.evaluation_summary.whatsapp_evidence_url, '_blank')}>
                                        <img src={Array.isArray(selectedSurvey.evaluation_summary.whatsapp_evidence_url) ? selectedSurvey.evaluation_summary.whatsapp_evidence_url[0] : selectedSurvey.evaluation_summary.whatsapp_evidence_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform" alt="WA Evidence" />
                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Search className="w-6 h-6 text-white" />
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-2">⚡ Bukti Komunikasi</h4>
                                        <p className="text-sm font-bold text-gray-800 leading-tight mb-2">Screenshot Chat/Video Call WhatsApp</p>
                                        <p className="text-[11px] text-gray-400 font-medium italic leading-relaxed">Klik foto untuk melihat bukti komunikasi antara agen kami dengan pemilik kost/penghuni di lokasi saat proses verifikasi.</p>
                                    </div>
                                </div>
                            )}

                            <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm mb-8">
                                <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-emerald-500" /> Summary Penilaian Unit Kost
                                </h4>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {[
                                        { id: 'room_facilities', label: 'Fasilitas Kamar', icon: '🛏️', color: 'bg-blue-50 text-blue-600' },
                                        { id: 'bathroom_facilities', label: 'Fasilitas WC', icon: '🚿', color: 'bg-emerald-50 text-emerald-600' },
                                        { id: 'kitchen_facilities', label: 'Fasilitas Dapur', icon: '🍳', color: 'bg-amber-50 text-amber-600' },
                                        { id: 'public_facilities', label: 'Fasilitas Umum', icon: '🛋️', color: 'bg-indigo-50 text-indigo-600' },
                                        { id: 'water_check', label: 'Pengecekan Air', icon: '💧', color: 'bg-cyan-50 text-cyan-600' },
                                        { id: 'wifi_check', label: 'Pengecekan WiFi', icon: '📶', color: 'bg-indigo-50 text-indigo-600' },
                                        { id: 'security_check', label: 'Pengecekan Keamanan', icon: '🛡️', color: 'bg-purple-50 text-purple-600' },
                                        { id: 'access_check', label: 'Akses Umum/Toko', icon: '📍', color: 'bg-orange-50 text-orange-600' },
                                        { id: 'building_conditions', label: 'Kondisi Bangunan', icon: '🏠', color: 'bg-slate-50 text-slate-600' },
                                    ].map((item) => {
                                        const categoryChecklists: Record<string, string[]> = {
                                            room_facilities: ['Tempat Tidur', 'Bantal', 'Sprei', 'Lemari Pakaian', 'Meja Belajar/Kerja', 'Kursi', 'Cermin', 'Rak Sepatu', 'AC', 'Kipas Angin', 'TV', 'Kulkas', 'Stop Kontak', 'Listrik/Kamar'],
                                            bathroom_facilities: ['WC Dalam', 'WC Umum', 'Kloset Duduk', 'Kloset Jongkok', 'Shower', 'Bak Mandi', 'Gayung', 'Ember', 'Wastafel', 'Cermin WC', 'Gantungan Baju', 'Exhaust Fan', 'Water Heater'],
                                            kitchen_facilities: ['Dapur Umum', 'Dapur Dalam', 'Kompor', 'Gas', 'Kulkas', 'Wastafel Dapur', 'Rak Piring', 'Meja Dapur', 'Alat Masak', 'Alat Makan', 'Tempat Sampah'],
                                            public_facilities: ['Ruang Tamu', 'Dapur Bersama', 'WiFi', 'Listrik Umum', 'Jemuran', 'Mesin Cuci', 'Ruang Santai', 'Parkir Motor', 'Parkir Mobil'],
                                            water_check: ['Air Bersih/Jernih', 'Air Tidak Berbau', 'Aliran Air Deras', 'Keran Berfungsi Baik'],
                                            wifi_check: ['WiFi Tersedia'],
                                            security_check: ['CCTV Aktif', 'Gembok/Pagar', 'Akses 24 Jam', 'Batas Jam Malam', 'Penjaga Kos/Satpam', 'Lingkungan Aman'],
                                            access_check: ['Akses Mobil Mudah', 'Akses Motor Mudah', 'Dalam Gang', 'Dekat Jalan Utama', 'Dekat Masjid', 'Dekat Gereja', 'Dekat Warung Makan', 'Dekat Minimarket', 'Dekat Toko Grosir', 'Dekat Kampus/Kantor', 'Jalanan Beraspal', 'Bebas Banjir'],
                                            building_conditions: ['Bangunan Baru', 'Bangunan Terawat', 'Cat Masih Bagus', 'Tidak Ada Retak', 'Atap Tidak Bocor', 'Tidak Ada Rembes', 'Tidak Ada Jamur Dinding', 'Sirkulasi Udara Lancar']
                                        };

                                        const currentOptions = categoryChecklists[item.id] || [];
                                        const checkedItems = selectedSurvey.evaluation_summary?.[`${item.id}_checklist`] || [];

                                        return (
                                            <div key={item.id} className="flex flex-col h-full border-b border-gray-100 pb-8 md:border-b-0 md:pb-0">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`p-1.5 rounded-lg text-xs ${item.color.split(' ')[0]}`}>{item.icon}</span>
                                                        <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">{item.label}</span>
                                                    </div>
                                                    <StarRatingDisplay rating={selectedSurvey.evaluation_summary?.[`${item.id}_rating`]} />
                                                </div>

                                                <div className="bg-gray-50/50 p-6 rounded-[2rem] border border-gray-100/50 flex flex-col h-full">
                                                    {/* Display All Checklist Items (Checked & Unchecked) */}
                                                    <div className="grid grid-cols-2 gap-x-3 gap-y-2 mb-6">
                                                        {currentOptions.map((option: string, cidx: number) => {
                                                            const isChecked = checkedItems.includes(option);
                                                            const dist = selectedSurvey.evaluation_summary?.[`${item.id}_${option}_dist`];
                                                            const unit = selectedSurvey.evaluation_summary?.[`${item.id}_${option}_unit`];
                                                            const name = selectedSurvey.evaluation_summary?.[`${item.id}_${option}_name`];
                                                            
                                                            return (
                                                                <div key={cidx} className={`flex items-start gap-2 p-1.5 rounded-xl transition-all ${isChecked ? 'bg-white shadow-sm border border-orange-100' : 'opacity-40 grayscale-[0.5]'}`}>
                                                                    <span className={`shrink-0 text-[10px] font-black ${isChecked ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                                        {isChecked ? '✓' : '✗'}
                                                                    </span>
                                                                    <div className="flex flex-col min-w-0">
                                                                        <span className={`text-[9px] font-bold uppercase tracking-tight leading-normal whitespace-normal break-words ${isChecked ? 'text-gray-900' : 'text-gray-400'}`}>
                                                                            {option}
                                                                        </span>
                                                                        {isChecked && (dist || name) && (
                                                                            <span className="text-[8px] font-black text-orange-500 leading-none mt-0.5">
                                                                                {dist ? `${dist}${unit || 'm'}` : ''} {name ? `(${name})` : ''}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>

                                                    <div className="space-y-1.5 mb-6 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex-grow">
                                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                                            📝 Catatan Surveyor
                                                        </p>
                                                        <p className="text-[12px] font-bold text-gray-800 leading-relaxed italic">
                                                            "{selectedSurvey.evaluation_summary?.[item.id] || 'Tidak ada catatan surveyor untuk poin ini.'}"
                                                        </p>
                                                    </div>
                                                    
                                                    {item.id === 'wifi_check' && selectedSurvey.evaluation_summary?.wifi_speed && (
                                                        <div className="mb-6 inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-600 rounded-full w-fit shadow-md shadow-indigo-100">
                                                            <span className="text-[10px] font-black text-white uppercase tracking-wider flex items-center gap-2">
                                                                <Zap size={10} fill="currentColor" /> {selectedSurvey.evaluation_summary.wifi_speed} MBPS
                                                            </span>
                                                        </div>
                                                    )}

                                                    {/* Photos for this category */}
                                                    <div className="space-y-3 pt-6 border-t border-gray-200/50 mt-auto">
                                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                                            ⚡ Foto Bukti Lapangan
                                                        </p>
                                                        <div className="grid grid-cols-3 gap-3">
                                                            {selectedSurvey.evaluation_summary?.[`${item.id}_photos`]?.length > 0 ? (
                                                                selectedSurvey.evaluation_summary[`${item.id}_photos`].map((url: string, idx: number) => (
                                                                    <div
                                                                        key={idx}
                                                                        className="relative aspect-square rounded-2xl overflow-hidden border border-gray-200 cursor-pointer hover:scale-[1.05] active:scale-95 transition-all shadow-sm group"
                                                                        onClick={() => window.open(url, '_blank')}
                                                                    >
                                                                        <img src={url} alt={`${item.label} proof`} className="w-full h-full object-cover" />
                                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                            <Search className="w-6 h-6 text-white" />
                                                                        </div>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <div className="col-span-3 h-24 rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center bg-white/50">
                                                                    <p className="text-[10px] font-bold text-gray-400 italic">Belum ada foto</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    <div className="md:col-span-2 space-y-4 pt-10 border-t border-gray-100 mt-6">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="p-1.5 rounded-lg text-xs bg-pink-50">🌳</span>
                                                <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Kondisi Lingkungan Sekitar Kost</span>
                                            </div>
                                            <StarRatingDisplay rating={selectedSurvey.evaluation_summary?.environmental_conditions_rating} />
                                        </div>
                                        <div className="bg-gray-50/50 p-8 rounded-[3rem] border border-gray-100/50 relative overflow-hidden">
                                            <div className="absolute top-0 left-0 text-6xl text-gray-200/30 font-serif p-4 pointer-events-none">"</div>
                                            
                                            {/* Checklist for environment */}
                                            {(() => {
                                                const envOptions = ['Area Kostan', 'Area Perumahan', 'Padat Penduduk', 'Lingkungan Tenang', 'Bebas Bau/Polusi', 'Pencahayaan Baik', 'Bebas Hewan/Serangga'];
                                                const checkedEnv = selectedSurvey.evaluation_summary?.environmental_conditions_checklist || [];
                                                
                                                return (
                                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8 pl-6 relative z-10">
                                                        {envOptions.map((option, idx) => {
                                                            const isChecked = checkedEnv.includes(option);
                                                            return (
                                                                <div key={idx} className={`flex items-center gap-2 p-2 rounded-xl border ${isChecked ? 'bg-white border-orange-100 shadow-sm' : 'opacity-40 border-transparent'}`}>
                                                                    <span className={`text-[10px] font-black ${isChecked ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                                        {isChecked ? '✓' : '✗'}
                                                                    </span>
                                                                    <span className={`text-[9px] font-bold uppercase tracking-tighter ${isChecked ? 'text-gray-900' : 'text-gray-400'}`}>
                                                                        {option}
                                                                    </span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                );
                                            })()}

                                            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm relative z-10 pl-6 mb-8">
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                                                    📝 Catatan Lingkungan
                                                </p>
                                                <p className="text-sm font-medium text-gray-600 italic leading-relaxed">
                                                    "{selectedSurvey.evaluation_summary?.environmental_conditions || 
                                                     selectedSurvey.evaluation_summary?.environment_conditions || 
                                                     selectedSurvey.evaluation_summary?.resident_testimonial || 
                                                     'Belum ada catatan kondisi lingkungan yang tercatat.'}"
                                                </p>
                                            </div>

                                            {/* Photos for environment */}
                                            <div className="space-y-4 relative z-10 pl-6">
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                                    ⚡ Foto Lingkungan Sekitar
                                                </p>
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                                    {(selectedSurvey.evaluation_summary?.environmental_conditions_photos || 
                                                      selectedSurvey.evaluation_summary?.environment_conditions_photos || 
                                                      selectedSurvey.evaluation_summary?.resident_testimonial_photos || [])?.length > 0 ? (
                                                        (selectedSurvey.evaluation_summary.environmental_conditions_photos || 
                                                         selectedSurvey.evaluation_summary.environment_conditions_photos || 
                                                         selectedSurvey.evaluation_summary.resident_testimonial_photos).map((url: string, idx: number) => (
                                                            <div
                                                                key={idx}
                                                                className="relative aspect-video rounded-2xl overflow-hidden border border-gray-200 cursor-pointer hover:scale-[1.05] active:scale-95 transition-all shadow-md group"
                                                                onClick={() => window.open(url, '_blank')}
                                                            >
                                                                <img src={url} alt="Environment proof" className="w-full h-full object-cover" />
                                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                    <Search className="w-6 h-6 text-white" />
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="col-span-full h-24 rounded-[2rem] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center bg-white/50">
                                                            <p className="text-[10px] font-bold text-gray-400 italic">Belum ada lampiran foto</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Drive Link Section */}
                            {selectedSurvey.result_drive_link && (
                                <div className="bg-emerald-50 rounded-[2rem] p-8 border border-emerald-100 text-center">
                                    <h4 className="text-[11px] font-black text-emerald-700 uppercase tracking-widest mb-4">Dokumentasi Lengkap</h4>
                                    <p className="text-sm text-emerald-800 font-medium mb-6">Lihat foto dan video detail hasil survei di folder Google Drive kami.</p>
                                    <button
                                        onClick={() => window.open(selectedSurvey.result_drive_link, '_blank')}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-200 transition-all active:scale-95 flex items-center justify-center gap-3 mx-auto"
                                    >
                                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M7.71 3.5l2.43 4.2h9.11L16.82 3.5H7.71zM3.48 11.02l2.44 4.2h9.11l2.42-4.2H3.48zm2.44-5.22L1.5 13l4.42 7.65 4.42-7.65L5.92 5.8z" /></svg>
                                        Buka Google Drive
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-8 bg-white border-t border-gray-100 relative flex-shrink-0">
                            <button
                                onClick={() => setShowSurveySummaryModal(false)}
                                className="w-full py-4 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all"
                            >
                                Selesai Membaca
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* 2. Modal Pelacakan Real-time Survey Kost */}
            {showTrackingModal && selectedTrackingSurvey && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-lg my-auto relative shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-gray-100">
                        {/* Header */}
                        <div className="bg-white px-8 pt-8 pb-6 border-b border-gray-100 relative">
                            <button 
                                onClick={() => setShowTrackingModal(false)} 
                                className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-full p-2 transition-colors border border-gray-100"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center border border-orange-100 shrink-0">
                                    <Activity className="w-6 h-6 text-orange-500 animate-pulse" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em] mb-0.5">Pelacakan Survey</p>
                                    <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase truncate max-w-[280px]">
                                        {selectedTrackingSurvey.kost_name}
                                    </h3>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-8 max-h-[60vh] overflow-y-auto scrollbar-thin">
                            {/* Reschedule Banner */}
                            {selectedTrackingSurvey.status === 'RESCHEDULED' && (
                                <div className="mb-6 bg-amber-50 rounded-[2rem] p-5 border border-amber-100 flex items-start gap-3.5 shadow-sm animate-in fade-in duration-300">
                                    <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-amber-500 shadow-sm shrink-0">⚠️</div>
                                    <div className="flex-1">
                                        <h4 className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-1">Pemberitahuan Penjadwalan Ulang</h4>
                                        <p className="text-xs text-amber-800 font-bold mb-1">
                                            Jadwal Terbaru: <span className="underline">{selectedTrackingSurvey.survey_date} pukul {selectedTrackingSurvey.survey_time}</span>
                                        </p>
                                        <p className="text-xs text-amber-700 font-medium leading-relaxed italic">
                                            Alasan: "{selectedTrackingSurvey.notes || 'Penyesuaian jadwal lapangan oleh Surveyor.'}"
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Riwayat Reschedule */}
                            {(() => {
                                const summary = selectedTrackingSurvey.evaluation_summary;
                                let parsedSummary = summary;
                                if (typeof summary === 'string') {
                                    try {
                                        parsedSummary = JSON.parse(summary);
                                    } catch {
                                        parsedSummary = {};
                                    }
                                }
                                const history = parsedSummary?.reschedule_history;
                                if (!Array.isArray(history) || history.length === 0) return null;

                                return (
                                    <div className="mb-6 bg-gray-50 rounded-[2rem] p-5 border border-gray-200/60 shadow-sm animate-in fade-in duration-300">
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="text-sm">🗓️</span>
                                            <h4 className="text-[10px] font-black text-gray-700 uppercase tracking-widest">Riwayat Penjadwalan Ulang</h4>
                                        </div>
                                        <div className="space-y-3 relative before:absolute before:inset-y-1 before:left-3 before:w-0.5 before:bg-gray-200">
                                            {history.slice().reverse().map((item: any, idx: number) => (
                                                <div key={idx} className="relative pl-7 text-xs">
                                                    <div className="absolute left-[9px] top-1.5 w-2 h-2 rounded-full bg-gray-400 border border-white shadow-sm" />
                                                    <p className="font-bold text-gray-800">
                                                        Jadwal: {item.date} pukul {item.time}
                                                    </p>
                                                    <p className="text-gray-500 italic mt-0.5">
                                                        Alasan: "{item.reason || 'Penyesuaian jadwal lapangan.'}"
                                                    </p>
                                                    <p className="text-[9px] text-gray-400 font-medium mt-0.5">
                                                        Diajukan pada: {new Date(item.updatedAt).toLocaleString('id-ID')}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Surveyor Card (jika sudah ada) */}
                            {(() => {
                                const s = selectedTrackingSurvey;
                                if (!s.agent_name) return null;
                                return (
                                    <div className="mb-8 p-5 bg-gray-50/50 rounded-[2rem] border border-gray-100 flex items-center gap-4 shadow-sm">
                                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center overflow-hidden shrink-0 border border-gray-200/60 shadow-inner">
                                            {s.agent_photo_url ? (
                                                <img src={s.agent_photo_url} alt={s.agent_name} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-lg font-black text-gray-400">{s.agent_name.charAt(0)}</span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Petugas Lapangan</p>
                                            <p className="text-sm font-black text-gray-900 truncate">{s.agent_name}</p>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                                                    {s.status === 'AGENT_ASSIGNED' && 'Sudah ditugaskan'}
                                                    {s.status === 'RESCHEDULED' && 'Jadwal Diperbarui'}
                                                    {s.status === 'HEADING_TO_LOCATION' && 'Menuju lokasi'}
                                                    {s.status === 'SURVEYING' && 'Sedang memeriksa kost'}
                                                    {['SUBMITTED', 'COMPLETED'].includes(s.status) && 'Tugas selesai'}
                                                </p>
                                            </div>
                                        </div>
                                        {s.agent_phone && (
                                            <button
                                                onClick={() => {
                                                    const clean = s.agent_phone.replace(/\D/g, '');
                                                    const num = clean.startsWith('0') ? '62' + clean.substring(1) : clean;
                                                    window.open(`https://wa.me/${num}`, '_blank');
                                                }}
                                                className="p-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-all shadow-md shadow-emerald-100 hover:shadow-emerald-200 active:scale-95 shrink-0"
                                                title="Hubungi Surveyor"
                                            >
                                                <MessageSquare className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                );
                            })()}

                            {/* Stepper Timeline */}
                            {(() => {
                                const currentStatus = selectedTrackingSurvey.status;
                                const getActiveStepIndex = (status: string) => {
                                    switch (status) {
                                        case 'AWAITING_PAYMENT': return 0;
                                        case 'PENDING_ASSIGNMENT': return 1;
                                        case 'AGENT_ASSIGNED': return 2;
                                        case 'RESCHEDULED': return 2;
                                        case 'HEADING_TO_LOCATION': return 3;
                                        case 'SURVEYING': return 4;
                                        case 'SUBMITTED': return 5;
                                        case 'COMPLETED': return 5;
                                        default: return 0;
                                    }
                                };
                                const activeIndex = getActiveStepIndex(currentStatus);

                                const trackingSteps = [
                                    {
                                        title: 'Menunggu Pembayaran',
                                        description: 'Selesaikan transaksi survey.',
                                        subtext: 'Menunggu pembayaran via Midtrans.',
                                        icon: Receipt,
                                    },
                                    {
                                        title: 'Mencari Agen Surveyor',
                                        description: 'Mencocokkan pesanan Anda.',
                                        subtext: 'Sistem sedang menugaskan agen surveyor terdekat.',
                                        icon: Search,
                                    },
                                    {
                                        title: 'Agen Surveyor Ditetapkan',
                                        description: 'Surveyor ditugaskan.',
                                        subtext: 'Nama dan kontak agen lapangan sudah terdaftar.',
                                        icon: Smartphone,
                                    },
                                    {
                                        title: 'Menuju Lokasi Kost',
                                        description: 'Surveyor berkendara ke lokasi.',
                                        subtext: 'Agen sedang di perjalanan menuju kost target.',
                                        icon: MapPin,
                                    },
                                    {
                                        title: 'Proses Audit Lapangan',
                                        description: 'Pengecekan fasilitas kost.',
                                        subtext: 'Pemeriksaan listrik, air, kebersihan, dan wawancara.',
                                        icon: Activity,
                                    },
                                    {
                                        title: 'Laporan Hasil Survey',
                                        description: 'Laporan siap dibaca.',
                                        subtext: 'Dokumentasi dan review jujur siap diakses.',
                                        icon: CheckCircle,
                                    }
                                ];

                                return (
                                    <div className="space-y-6">
                                        {trackingSteps.map((step, idx) => {
                                            const StepIcon = step.icon;
                                            const isCompleted = idx < activeIndex;
                                            const isActive = idx === activeIndex;

                                            return (
                                                <div key={idx} className="flex gap-4">
                                                    {/* Vertical indicator column */}
                                                    <div className="flex flex-col items-center shrink-0">
                                                        {/* Circle Marker */}
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-500 z-10 ${
                                                            isCompleted 
                                                                ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-100' 
                                                                : isActive 
                                                                    ? 'bg-orange-500 border-orange-500 text-white shadow-md shadow-orange-100 ring-4 ring-orange-500/20' 
                                                                    : 'bg-white border-gray-200 text-gray-400'
                                                        }`}>
                                                            {isCompleted ? (
                                                                <Check className="w-4 h-4" />
                                                            ) : (
                                                                <StepIcon className="w-4 h-4" />
                                                            )}
                                                        </div>
                                                        
                                                        {/* Connector line below the circle */}
                                                        {idx < trackingSteps.length - 1 && (
                                                            <div className={`w-0.5 h-12 my-1 ${
                                                                isCompleted ? 'bg-emerald-500' : 'bg-gray-200'
                                                            }`} />
                                                        )}
                                                    </div>

                                                    {/* Text content column */}
                                                    <div className="flex-1 pt-0.5 min-w-0">
                                                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider mb-1.5 ${
                                                            isCompleted 
                                                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                                                                : isActive 
                                                                    ? 'bg-orange-50 text-orange-600 border border-orange-100 animate-pulse' 
                                                                    : 'bg-gray-50 text-gray-400 border border-gray-100'
                                                        }`}>
                                                            {isCompleted ? 'Selesai' : isActive ? 'Progres' : 'Mendatang'}
                                                        </span>
                                                        <h4 className={`text-xs font-black uppercase tracking-wider ${
                                                            isCompleted ? 'text-gray-700' : isActive ? 'text-orange-600' : 'text-gray-400'
                                                        }`}>
                                                            {step.title}
                                                        </h4>
                                                        <p className={`text-xs font-bold mt-1 leading-relaxed ${isActive ? 'text-gray-800' : 'text-gray-500'}`}>
                                                            {step.description}
                                                        </p>
                                                        <p className="text-[10px] text-gray-400 font-medium mt-0.5 italic">
                                                            {step.subtext}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Footer / Contextual Action Button */}
                        <div className="p-8 bg-gray-50 border-t border-gray-100 flex flex-col gap-3">
                            {selectedTrackingSurvey.status === 'SUBMITTED' && (
                                <button
                                    onClick={() => {
                                        handleConfirmSurvey(selectedTrackingSurvey.id);
                                        setShowTrackingModal(false);
                                    }}
                                    disabled={isSubmitting}
                                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-emerald-200 active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <CheckCircle className="w-4 h-4" /> Konfirmasi Selesai & Laporan Oke
                                </button>
                            )}

                            {selectedTrackingSurvey.status === 'COMPLETED' && selectedTrackingSurvey.evaluation_summary && (
                                <button
                                    onClick={() => {
                                        let parsed = selectedTrackingSurvey.evaluation_summary;
                                        if (typeof parsed === 'string') { try { parsed = JSON.parse(parsed); } catch { parsed = {}; } }
                                        setSelectedSurvey({ ...selectedTrackingSurvey, evaluation_summary: parsed });
                                        setShowTrackingModal(false);
                                        setShowSurveySummaryModal(true);
                                    }}
                                    className="w-full py-4 bg-gray-900 hover:bg-gray-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <FileText className="w-4 h-4 text-orange-400" /> Buka Laporan Audit
                                </button>
                            )}

                            <button
                                onClick={() => setShowTrackingModal(false)}
                                className="w-full py-4 bg-white hover:bg-gray-100 text-gray-600 border border-gray-200 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                            >
                                Tutup Pelacakan
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 7. Modal Kwitansi Resmi Digital */}
            <DigitalReceiptModal
                isOpen={showDigitalReceiptModal}
                onClose={() => setShowDigitalReceiptModal(false)}
                receipt={selectedReceipt}
            />

            {/* 8. Modal Pratinjau Galeri Foto Kamar & Fasilitas */}
            {galleryModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-3xl rounded-[2.5rem] overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-slate-50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-orange-100 rounded-xl">
                                    <Camera className="w-5 h-5 text-orange-600" />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-gray-900 uppercase tracking-tight">{galleryTitle}</h3>
                                    <p className="text-xs text-gray-400 font-medium">Dokumentasi foto unit kamar & fasilitas hunian ({galleryPhotos.length} foto)</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setGalleryModalOpen(false)}
                                className="w-9 h-9 rounded-full bg-white border border-gray-200 hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Photo Grid / Gallery Content */}
                        <div className="p-6 overflow-y-auto space-y-4">
                            {galleryPhotos.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {galleryPhotos.map((photo, pIdx) => (
                                        <div key={pIdx} className="group relative rounded-2xl overflow-hidden shadow-md border border-gray-100 aspect-video bg-slate-900">
                                            <img
                                                src={photo}
                                                alt={`Dokumentasi kamar ${pIdx + 1}`}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                            <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-lg border border-white/20">
                                                Foto #{pIdx + 1}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-gray-400">
                                    <Camera className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                                    <p className="text-sm font-bold">Belum ada foto tambahan</p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-gray-100 bg-gray-50 text-right">
                            <button
                                onClick={() => setGalleryModalOpen(false)}
                                className="px-6 py-2.5 bg-gray-900 hover:bg-black text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                            >
                                Tutup Galeri
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <TimeSimulator />
        </div>
    );
};


export default MyKost;
