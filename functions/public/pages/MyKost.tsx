import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../supabase';
import { ArrowLeft, Clock, MapPin, Receipt, Upload, Plus, MessageSquare, AlertCircle, FileText, X, Star, CheckCircle, Smartphone, Calendar, Search, Heart, ChevronRight, XCircle, Zap, Check } from 'lucide-react';
import { Page } from '../types';
import { addPropertyReview, getExtraBills, settlePendingBills, cancelBookingRequest } from '../userService';
import PaymentGateway from '../components/PaymentGateway';
import ChatWindow from '../components/ChatWindow';
import { notifyAdminTransaction } from '../emailService';
import { FORMAT_CURRENCY } from '../constants';
import { getCurrentDate, setMockDate, getMockDateStr, parseDateSafely, calculateDaysRemaining } from '../utils/timeUtils';
import TimeSimulator from '../components/TimeSimulator';
import { getResidentStatus, syncResidentStatus, autoSyncPaidSurveys } from '../adminService';

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

    // Rating form state
    const [ratingValue, setRatingValue] = useState(5);
    const [ratingComment, setRatingComment] = useState('');

    // Extension form state
    const [extensionPeriod, setExtensionPeriod] = useState(1);
    const [extensionProof, setExtensionProof] = useState<File | null>(null);

    // Extra bill form state
    const [billName, setBillName] = useState('');
    const [billAmount, setBillAmount] = useState('');
    const [billProof, setBillProof] = useState<File | null>(null);

    // Complaint form state
    const [complaintTitle, setComplaintTitle] = useState('');
    const [complaintDesc, setComplaintDesc] = useState('');
    const [complaintPhoto, setComplaintPhoto] = useState<File | null>(null);

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

            return () => {
                supabase.removeChannel(channel);
            };
        } else {
            setLoading(false);
        }
    }, [user]);

    const handleOpenChat = async (kost: any) => {
        if (!user) return;
        try {
            setIsSubmitting(true);

            // Ambil detail properti untuk mendapatkan info omnichannel
            const { data: propData, error: propError } = await supabase
                .from('properties')
                .select('owner_uid, title, omnichannel_contact_name, omnichannel_contact_type')
                .eq('id', kost.kostId)
                .single();

            if (propError) {
                console.warn('Property not found in Supabase for chat:', propError);
                // Fallback jika properti tidak ditemukan di Supabase (misal data legacy)
                const ownerId = SYSTEM_ADMIN_ID;
                const session = await getOrCreateChatSession(user.uid, ownerId, null);

                setActiveChatSession({
                    ...session,
                    propertyName: kost.kostName || 'Kost Saya',
                    contactName: 'Admin',
                    contactType: 'owner'
                });
                setShowChatWindow(true);
                return;
            }

            const ownerId = propData.owner_uid;
            if (!ownerId) {
                alert('Pemilik kost ini belum terdaftar di sistem chat. Hubungi admin RS jika berkelanjutan.');
                return;
            }

            const session = await getOrCreateChatSession(user.uid, ownerId, kost.kostId);

            setActiveChatSession({
                ...session,
                propertyName: propData.title || kost.kostName,
                contactName: propData.omnichannel_contact_name,
                contactType: propData.omnichannel_contact_type
            });
            setShowChatWindow(true);
        } catch (error) {
            console.error('Failed to open chat:', error);
            alert('Gagal membuka chat. Pastikan koneksi internet stabil atau hubungi sistem admin RuangSinggah.');
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
            await cancelBookingRequest(kost.id);
            alert('Pengajuan sewa berhasil dibatalkan.');
            fetchMyKosts(); // Refresh list
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
        autoSyncPaidSurveys(user.uid).catch(console.error);
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

            // Merge both data sources and remove duplicates by ID or specific logic
            // Priority: resident_status has more info for active tenants, transactions for pending bookings
            const combinedData = [...(statusData || [])];

            // Add transactions that are not already linked to a resident_status (to avoid duplicates)
            const linkedTrxIds = new Set(statusData?.map((r: any) => r.transaction_id).filter(Boolean));
            const activeKostIds = new Set(statusData?.map((r: any) => r.kost_id).filter(Boolean));

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
            } else {
                setActiveKosts([]);
                setLoading(false);
                return;
            }

            // Batch fetch unique properties since join might fail due to FK issues
            const productIds = Array.from(new Set(data?.map(d => d.product_id || d.kost_id).filter(id => !!id)));
            const { data: propertiesData } = await supabase
                .from('properties')
                .select('id, title, image_urls, owner_uid, city, area, additional_fee_name, additional_fee_price, additional_fee_starts_from, room_types, location')
                .in('id', productIds);

            const propMap = (propertiesData || []).reduce((acc: any, p: any) => {
                acc[p.id] = p;
                return acc;
            }, {});

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

                    let displayImg = null;
                    const prop = propMap[doc.product_id || doc.kost_id];
                    const rawImages = prop?.image_urls || doc.image_urls || metadata.imageUrls || [];

                    if (rawImages.length > 0) {
                        const img = rawImages[0];
                        const path = typeof img === 'string' ? img : (img.original || img.webp || '');
                        if (path) {
                            if (path.startsWith('http')) {
                                displayImg = path;
                            } else {
                                const { data: { publicUrl } } = supabase.storage.from('properties').getPublicUrl(path);
                                displayImg = publicUrl;
                            }
                        }
                    }

                    // Fallback to fetching property image if missing in metadata
                    if (!displayImg && (doc.kost_id || doc.product_id)) {
                        const id = doc.kost_id || doc.product_id;
                        // Since this is a loop, ideally we'd batch fetch, but for small counts this is okay.
                        // Or we can just rely on the user creating a NEW booking with the updated metadata.
                    }

                    kostsData.push({
                        id: doc.id,
                        kostName: prop?.title || doc.properties?.title || doc.kost_name || metadata.kostName,
                        kostId: prop?.id || doc.properties?.id || doc.kost_id || doc.product_id,
                        roomType: doc.room_type || metadata.roomType,
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

            // De-duplicate by kostId to avoid showing multiple cards for the same property
            // Priority: PAID > AWAITING_PAYMENT > PENDING_APPROVAL > REJECTED/CANCELLED
            const statusPriority: Record<string, number> = {
                'paid': 4, 'approved': 4, 'selesai': 4, 'success': 4, 'berhasil': 4,
                'awaiting_payment': 3,
                'pending_approval': 2,
                'rejected': 1, 'cancelled': 1
            };

            const uniqueKosts = Object.values(kostsData.reduce((acc: Record<string, any>, curr: any) => {
                const statusLower = (curr.status || '').toLowerCase();
                // Group by kostId + roomType to show the single "best" status for that specific lease
                const uniqueKey = `${curr.kostId}_${(curr.roomType || '').toLowerCase()}`;

                if (!acc[uniqueKey]) {
                    acc[uniqueKey] = curr;
                } else {
                    const existingStatus = (acc[uniqueKey].status || '').toLowerCase();
                    const currentStatus = (curr.status || '').toLowerCase();

                    const pExisting = statusPriority[existingStatus] || 0;
                    const pCurrent = statusPriority[currentStatus] || 0;

                    if (pCurrent > pExisting) {
                        acc[uniqueKey] = curr;
                    } else if (pCurrent === pExisting) {
                        // If priority is same, take the latest one
                        const tExisting = new Date(acc[uniqueKey].created_at || 0).getTime();
                        const tCurrent = new Date(curr.created_at || 0).getTime();
                        if (tCurrent > tExisting) {
                            acc[uniqueKey] = curr;
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
                return { ...k, pendingBills: pendBills, totalPendingBills: totalPend };
            });

            // Fetch actual resident status (Source of Truth for Aktif tab)
            const statusRecords = await getResidentStatus({ userId: user.uid });

            // Map resident status to match the UI expectations of activeKosts
            const processedActive = statusRecords.map(r => {
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

                // Image resolution
                let displayImg = null;
                const rawImages = prop.image_urls || [];
                if (rawImages.length > 0) {
                    const img = rawImages[0];
                    const path = typeof img === 'string' ? img : (img.original || img.webp || '');
                    if (path) {
                        displayImg = path.startsWith('http') ? path : supabase.storage.from('properties').getPublicUrl(path).data.publicUrl;
                    }
                }

                const rMeta = r.metadata || {};
                const lastTrxMeta = (r.last_transaction || {}).metadata || {};
                const combinedMeta = { ...lastTrxMeta, ...rMeta };

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

            setResidentStatus(uniqueActive);
            setActiveKosts(activeWithBills);

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
        if (!selectedKost || !complaintTitle || !complaintDesc) return;
        setIsSubmitting(true);

        let photoUrl = '';
        try {
            if (complaintPhoto) {
                const fileExt = complaintPhoto.name.split('.').pop();
                const fileName = `${user.uid}/${Date.now()}_comp.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('complaints')
                    .upload(fileName, complaintPhoto);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('complaints')
                    .getPublicUrl(fileName);
                photoUrl = publicUrl;
            }

            const { error: dbError } = await supabase.from('complaints').insert([{
                kost_id: selectedKost.kostId,
                kost_name: selectedKost.kostName,
                user_id: user.uid,
                user_name: user.name || user.displayName || 'Penyewa',
                user_phone: user.phone || user.phoneNumber || '-',
                title: complaintTitle,
                description: complaintDesc,
                photo_url: photoUrl,
                status: 'open',
            }]);

            if (dbError) throw dbError;

            alert('Komplain berhasil dikirim. Pemilik kost dan admin akan segera dihubungi.');
            setShowComplaintModal(false);
            setComplaintPhoto(null);
            setComplaintTitle('');
            setComplaintDesc('');
        } catch (err) {
            console.error(err);
            alert('Terjadi kesalahan saat mengirim komplain.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleConfirmSurvey = async (surveyId: string) => {
        if (!window.confirm('Apakah Anda puas dengan hasil survey ini dan ingin mengonfirmasi selesai?')) return;

        try {
            setIsSubmitting(true);
            const { error } = await supabase
                .from('survey_requests')
                .update({ status: 'COMPLETED', updated_at: new Date().toISOString() })
                .eq('id', surveyId);

            if (error) throw error;

            alert('Survey berhasil dikonfirmasi! Terima kasih telah menggunakan layanan RuangSinggah.');
            // Refresh surveys
            const { data } = await supabase
                .from('survey_requests')
                .select('*, user:user_id(name, phone)')
                .eq('user_id', user.uid);
            if (data) setSurveyRequests(data);
        } catch (err) {
            console.error(err);
            alert('Gagal mengonfirmasi survey.');
        } finally {
            setIsSubmitting(false);
        }
    };



    const renderSurveyCard = (survey: any) => {
        const status = survey.status;
        const statusColors: any = {
            'AWAITING_PAYMENT': 'bg-orange-50 text-orange-600 border-orange-100',
            'PENDING_ASSIGNMENT': 'bg-amber-50 text-amber-600 border-amber-100',
            'AGENT_ASSIGNED': 'bg-blue-50 text-blue-600 border-blue-100',
            'HEADING_TO_LOCATION': 'bg-indigo-50 text-indigo-600 border-indigo-100',
            'SURVEYING': 'bg-cyan-50 text-cyan-600 border-cyan-100',
            'SUBMITTED': 'bg-emerald-50 text-emerald-600 border-emerald-100',
            'COMPLETED': 'bg-green-50 text-green-600 border-green-100',
            'CANCELLED': 'bg-gray-50 text-gray-400 border-gray-100'
        };

        const statusLabels: any = {
            'AWAITING_PAYMENT': 'Menunggu Pembayaran',
            'PENDING_ASSIGNMENT': 'Mencari Agen Surveyor',
            'AGENT_ASSIGNED': 'Agen Ditetapkan',
            'HEADING_TO_LOCATION': 'Menuju Lokasi',
            'SURVEYING': 'Sedang Survey',
            'SUBMITTED': 'Laporan Terkirim',
            'COMPLETED': 'Survey Selesai',
            'CANCELLED': 'Survey Dibatalkan'
        };

        const currentStatusColor = statusColors[status] || 'bg-gray-50 text-gray-500 border-gray-100';
        const currentLabel = statusLabels[status] || status;

        return (
            <div key={survey.id} className="group relative bg-white rounded-[2.5rem] p-6 sm:p-10 border border-gray-100 shadow-xl shadow-gray-200/40 hover:shadow-2xl hover:shadow-gray-300/50 transition-all duration-500 overflow-hidden flex flex-col lg:flex-row gap-8 lg:gap-12">
                {/* Accent Background */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-orange-500/5 to-transparent rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none" />
                
                <div className="flex-1 relative z-10">
                    <div className="flex flex-col sm:flex-row items-start gap-6 sm:gap-8 mb-8">
                        {/* Icon/Image Box */}
                        <div className="relative shrink-0">
                            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-orange-50 rounded-[2rem] flex items-center justify-center border border-orange-100/50 shadow-inner group-hover:scale-105 transition-transform duration-500">
                                <Search className="w-10 h-10 text-orange-500" />
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-xl shadow-lg flex items-center justify-center border border-gray-50 text-sm">
                                ⚡
                            </div>
                        </div>

                        <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-3 mb-2">
                                <span className="text-[9px] font-black text-orange-500 uppercase tracking-[0.2em]">Layanan Jasa Survey</span>
                                <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border flex items-center gap-1.5 ${currentStatusColor}`}>
                                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                                    {currentLabel}
                                </div>
                            </div>
                            
                            <h3 className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight tracking-tight mb-4 group-hover:text-orange-600 transition-colors">
                                {survey.kost_name || 'Survey Lokasi Kost'}
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6">
                                <div className="flex items-center gap-3 text-xs font-bold text-gray-500">
                                    <div className="p-2 bg-gray-50 rounded-xl group-hover:bg-orange-50 transition-colors">
                                        <MapPin className="w-3.5 h-3.5 text-gray-400 group-hover:text-orange-500" />
                                    </div>
                                    <span className="truncate">{survey.kost_address}</span>
                                </div>
                                
                                {survey.owner_phone && (
                                    <div className="flex items-center gap-3 text-xs font-bold text-gray-500">
                                        <div className="p-2 bg-gray-50 rounded-xl group-hover:bg-emerald-50 transition-colors">
                                            <Smartphone className="w-3.5 h-3.5 text-gray-400 group-hover:text-emerald-500" />
                                        </div>
                                        <span>Pemilik: {survey.owner_phone}</span>
                                    </div>
                                )}

                                {(survey.survey_date || survey.survey_time) && (
                                    <div className="flex items-center gap-3 text-xs font-bold text-gray-500 sm:col-span-2">
                                        <div className="p-2 bg-gray-50 rounded-xl group-hover:bg-blue-50 transition-colors">
                                            <Calendar className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-500" />
                                        </div>
                                        <span className="italic">
                                            Jadwal: {survey.survey_date ? new Date(survey.survey_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '-'} @ {survey.survey_time || '-'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Agent Profile Section */}
                    {survey.agent_name ? (
                        <div className="mt-8 p-5 bg-gray-50/50 rounded-[2rem] border border-gray-100 flex items-center gap-4 group/agent transition-all hover:bg-white hover:shadow-lg hover:shadow-gray-200/50">
                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-lg font-black text-gray-300 overflow-hidden shrink-0 border border-gray-100 shadow-sm">
                                {survey.agent_photo_url ? (
                                    <img src={survey.agent_photo_url} alt={survey.agent_name} className="w-full h-full object-cover group-hover/agent:scale-110 transition-transform" />
                                ) : (
                                    <span>{survey.agent_name.charAt(0)}</span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Petugas Lapangan</p>
                                <p className="text-sm font-black text-gray-900 truncate">{survey.agent_name}</p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className={`w-1 h-1 rounded-full ${['COMPLETED', 'SUBMITTED'].includes(status) ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                                    <p className={`text-[9px] font-bold ${['COMPLETED', 'SUBMITTED'].includes(status) ? 'text-emerald-600' : 'text-blue-600'} uppercase tracking-wider`}>
                                        {status === 'SUBMITTED' ? 'Laporan Terkirim' : status === 'COMPLETED' ? 'Aktif' : 'Bertugas'}
                                    </p>
                                </div>
                            </div>
                            {['AGENT_ASSIGNED', 'HEADING_TO_LOCATION', 'SURVEYING'].includes(status) && survey.agent_phone && (
                                <button
                                    onClick={() => {
                                        const cleanPhone = survey.agent_phone.replace(/\D/g, '');
                                        const finalPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.substring(1) : cleanPhone;
                                        window.open(`https://wa.me/${finalPhone}`, '_blank');
                                    }}
                                    className="p-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-200 active:scale-90"
                                    title="Chat WA"
                                >
                                    <MessageSquare className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    ) : (
                        ['AGENT_ASSIGNED', 'HEADING_TO_LOCATION', 'SURVEYING'].includes(status) && (
                            <div className="mt-8 p-5 bg-gray-50/50 rounded-[2rem] border border-gray-100 flex items-center gap-4 animate-pulse">
                                <div className="w-12 h-12 bg-gray-100 rounded-xl shrink-0" />
                                <div className="space-y-2">
                                    <div className="h-2 bg-gray-200 rounded-full w-20" />
                                    <div className="h-3 bg-gray-200 rounded-full w-32" />
                                </div>
                            </div>
                        )
                    )}

                    {['AGENT_ASSIGNED', 'HEADING_TO_LOCATION', 'SURVEYING'].includes(status) && (
                        <div className="mt-4 flex items-start gap-3 p-3 px-4 bg-orange-50/50 rounded-2xl border border-orange-100/50">
                            <AlertCircle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                            <p className="text-[10px] font-bold text-gray-600 leading-relaxed">
                                Mohon standby! Agen kami mungkin akan menghubungi Anda via WhatsApp untuk verifikasi lokasi secara langsung.
                            </p>
                        </div>
                    )}
                </div>

                {/* Actions Section */}
                <div className="lg:w-72 shrink-0 flex flex-col justify-center gap-4 relative z-10 pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l border-gray-100 lg:pl-10">
                    {status === 'AWAITING_PAYMENT' && (
                        <button
                            onClick={() => {
                                setPaymentAmount(70000);
                                setPaymentOrderId(survey.transaction_id);
                                setPaymentProductId('5ea7b4e9-6f8d-4a11-b845-8c7a726359e1');
                                setPaymentProductType('survey');
                                setPaymentMetadata({
                                    kostName: survey.kost_name,
                                    kostAddress: survey.kost_address
                                });
                                setShowPaymentGateway(true);
                            }}
                            className="w-full bg-orange-600 hover:bg-orange-700 text-white p-5 rounded-2xl font-black flex flex-col items-center gap-1 transition-all shadow-xl shadow-orange-200 active:scale-[0.98]"
                        >
                            <div className="flex items-center gap-2 text-xs uppercase tracking-widest">
                                <Receipt className="w-4 h-4" /> Bayar Survey
                            </div>
                            <span className="text-[10px] opacity-70 font-bold">Rp 70.000</span>
                        </button>
                    )}

                    {status === 'SUBMITTED' && (
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => handleConfirmSurvey(survey.id)}
                                disabled={isSubmitting}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white p-5 rounded-2xl font-black flex flex-col items-center gap-1 transition-all shadow-xl shadow-emerald-200 active:scale-[0.98] animate-subtle-bounce"
                            >
                                <div className="flex items-center gap-2 text-xs uppercase tracking-widest">
                                    <CheckCircle className="w-4 h-4" /> Konfirmasi Selesai
                                </div>
                                <span className="text-[9px] opacity-70 font-bold text-center">Klik jika hasil survey sudah sesuai</span>
                            </button>
                        </div>
                    )}

                    {status === 'COMPLETED' && survey.evaluation_summary && (
                        <button
                            onClick={() => {
                                let parsedSummary = survey.evaluation_summary;
                                if (typeof survey.evaluation_summary === 'string') {
                                    try { parsedSummary = JSON.parse(survey.evaluation_summary); }
                                    catch (e) { parsedSummary = {}; }
                                }
                                setSelectedSurvey({ ...survey, evaluation_summary: parsedSummary });
                                setShowSurveySummaryModal(true);
                            }}
                            className="w-full bg-gray-900 hover:bg-gray-800 text-white p-5 rounded-2xl font-black flex items-center justify-center gap-3 transition-all shadow-xl shadow-gray-200 active:scale-[0.98] text-xs uppercase tracking-widest"
                        >
                            <FileText className="w-5 h-5 text-orange-500" /> Lihat Laporan
                        </button>
                    )}

                    {!['AWAITING_PAYMENT', 'SUBMITTED', 'COMPLETED'].includes(status) && (
                        <div className="p-6 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-relaxed">
                                {status === 'PENDING_ASSIGNMENT' ? 'Menunggu Penugasan' :
                                 status === 'AGENT_ASSIGNED' ? 'Menyiapkan Petugas' :
                                 status === 'HEADING_TO_LOCATION' ? 'Menuju Lokasi' :
                                 status === 'SURVEYING' ? 'Proses Pengambilan Foto' :
                                 'Mohon Menunggu'}
                            </p>
                        </div>
                    )}

                    {status === 'CANCELLED' && (
                        <div className="p-5 text-center bg-red-50 rounded-2xl border border-red-100">
                            <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">Dibatalkan</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

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
        const isPaid = ['APPROVED', 'PAID', 'SELESAI', 'SUCCESS', 'BERHASIL'].includes(s);
        const isPending = ['PENDING_APPROVAL', 'AWAITING_PAYMENT', 'PENDING'].includes(s);

        if (activeTab === 'diajukan') return isPending || s === 'REJECTED' || s === 'CANCELLED';

        if (activeTab === 'riwayat') {
            if (s === 'REJECTED' || s === 'CANCELLED') return true;
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
            'REJECTED': 3,
            'CANCELLED': 4
        };
        const sA = (a.status || '').toUpperCase();
        const sB = (b.status || '').toUpperCase();
        return (statusOrder[sA] || 99) - (statusOrder[sB] || 99);
    });

    const filteredSurveys = surveyRequests.filter(survey => {
        const s = survey.status;
        if (activeTab === 'diajukan') return ['PENDING_ASSIGNMENT', 'AWAITING_PAYMENT'].includes(s);
        if (activeTab === 'aktif') return ['AGENT_ASSIGNED', 'HEADING_TO_LOCATION', 'SURVEYING', 'SUBMITTED'].includes(s);
        if (activeTab === 'riwayat') return ['COMPLETED', 'CANCELLED'].includes(s);
        return false;
    });

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
                    <div className="bg-gray-100/50 p-1.5 rounded-[2rem] flex items-center gap-1 self-start md:self-auto border border-gray-100/80 backdrop-blur-sm">
                        {[
                            {
                                id: 'diajukan', label: 'Diajukan', count: activeKosts.filter(k => {
                                    const s = (k.status || '').toUpperCase();
                                    const isPending = ['PENDING_APPROVAL', 'AWAITING_PAYMENT', 'PENDING'].includes(s);
                                    return isPending || s === 'REJECTED' || s === 'CANCELLED';
                                }).length + surveyRequests.filter(s => ['PENDING_ASSIGNMENT', 'AWAITING_PAYMENT'].includes(s.status)).length
                            },
                            { id: 'aktif', label: 'Aktif', count: residentStatus.length + surveyRequests.filter(s => ['AGENT_ASSIGNED', 'HEADING_TO_LOCATION', 'SURVEYING'].includes(s.status)).length },
                            { id: 'riwayat', label: 'Riwayat', count: surveyRequests.filter(s => ['COMPLETED', 'CANCELLED'].includes(s.status)).length }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => handleTabChange(tab.id as any)}
                                className={`px-6 py-3.5 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.15em] transition-all duration-300 flex items-center gap-2.5 ${activeTab === tab.id
                                    ? 'bg-white text-orange-500 shadow-xl shadow-orange-100/50 border border-orange-100'
                                    : 'text-gray-400 hover:text-gray-600 hover:bg-white/50'
                                    }`}
                            >
                                {tab.label}
                                {tab.count > 0 && (
                                    <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-[9px] ${activeTab === tab.id ? 'bg-orange-100 text-orange-600' : 'bg-gray-200 text-gray-500'}`}>
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

                {(filteredKosts.length > 0 || filteredSurveys.length > 0) ? (
                    <div className="space-y-6 sm:space-y-8">
                        {/* Render Surveys First in Diajukan/Aktif */}
                        {filteredSurveys.map(survey => renderSurveyCard(survey))}

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

                            return (
                                <div key={kost.id} className="group relative bg-white rounded-[3rem] p-6 sm:p-10 border border-gray-100 shadow-xl shadow-gray-200/40 hover:shadow-2xl hover:shadow-gray-300/50 transition-all duration-700 overflow-hidden flex flex-col lg:grid lg:grid-cols-12 gap-10 sm:gap-14">
                                    {/* Accent Background */}
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-orange-500/5 to-transparent rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />

                                    <div className="lg:col-span-8 flex flex-col gap-8">
                                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 sm:gap-10 text-center sm:text-left">
                                            {/* Image Section */}
                                            <div className="relative shrink-0 group/img">
                                                <div className="w-48 h-36 sm:w-56 sm:h-44 bg-white rounded-[2rem] flex items-center justify-center shadow-xl shadow-orange-100 border-2 border-white transform hover:rotate-1 transition-all duration-700 overflow-hidden">
                                                    {kost.displayImage ? (
                                                        <img src={kost.displayImage} className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-1000" alt={kost.kostName} />
                                                    ) : (
                                                        <MapPin className="w-12 h-12 text-orange-200" />
                                                    )}
                                                </div>
                                                <div className="absolute -bottom-3 -right-3 w-12 h-12 bg-white rounded-2xl shadow-xl flex items-center justify-center border-2 border-orange-50 z-20">
                                                    <span className="text-2xl animate-pulse">⚡</span>
                                                </div>
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap justify-center sm:justify-start gap-2 mb-4">
                                                    {isPaid && (
                                                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider border flex items-center gap-1.5 ${
                                                            (kost.daysRemaining || 0) < 0 ? 'bg-gray-50 text-gray-400 border-gray-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                        }`}>
                                                            <CheckCircle className="w-3.5 h-3.5" />
                                                            {(kost.daysRemaining || 0) < 0 ? 'SUDAH HABIS' : 'SEDANG DISEWA'}
                                                        </span>
                                                    )}

                                                    {kost.daysRemaining !== null && isPaid && (
                                                        <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider border flex items-center gap-1.5 ${
                                                            kost.daysRemaining <= 7 ? 'bg-red-50 text-red-600 border-red-100 animate-pulse' : 'bg-orange-50 text-orange-600 border-orange-100'
                                                        }`}>
                                                            <Clock className="w-3.5 h-3.5" />
                                                            {kost.daysRemaining < 0 ? 'Habis' : `${kost.daysRemaining} Hari Lagi`}
                                                        </div>
                                                    )}

                                                    <span className="px-4 py-1.5 rounded-full text-[9px] font-black text-gray-500 uppercase tracking-wider bg-gray-50 border border-gray-100">
                                                        {kost.roomType || 'Standard'}
                                                    </span>
                                                </div>

                                                <button
                                                    onClick={() => navigate(`${Page.DETAIL}?kostId=${kost.kostId}`)}
                                                    className="group/title inline-flex items-center gap-3 text-3xl sm:text-4xl font-black text-gray-900 leading-tight tracking-tight hover:text-orange-600 transition-colors mb-4"
                                                >
                                                    <span className="uppercase">{kost.kostName || 'Kost Saya'}</span>
                                                    <ChevronRight className="w-6 h-6 opacity-0 -translate-x-4 group-hover/title:opacity-100 group-hover/title:translate-x-0 transition-all text-orange-500" />
                                                </button>

                                                {/* User Rating Display (Placeholder for future) */}
                                                <div className="flex items-center justify-center sm:justify-start gap-4">
                                                    <div className="flex gap-0.5">
                                                        {[1, 2, 3, 4, 5].map((s) => (
                                                            <Star key={s} className="w-3 h-3 text-orange-300 fill-orange-300" />
                                                        ))}
                                                    </div>
                                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Terverifikasi RuangSinggah</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Info Grid - Modern Minimalist Cards */}
                                        {isPaid && (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                                                {[
                                                    { label: 'Durasi', value: `${kost.duration || 1} ${kost.period}`, icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50/50' },
                                                    { label: 'Mulai', value: FORMAT_DATE(kost.moveInDate), icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50/50' },
                                                    { label: 'Selesai', value: FORMAT_DATE(kost.endDate), icon: Calendar, color: 'text-rose-500', bg: 'bg-rose-50/50' },
                                                    { label: 'Tagihan', value: FORMAT_CURRENCY(kost.totalPrice || 0), icon: Receipt, color: 'text-emerald-500', bg: 'bg-emerald-50/50' }
                                                ].map((item, idx) => (
                                                    <div key={idx} className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:border-orange-200 transition-colors group/stat">
                                                        <div className={`w-10 h-10 ${item.bg} rounded-xl flex items-center justify-center shrink-0 group-hover/stat:scale-110 transition-transform`}>
                                                            <item.icon className={`w-5 h-5 ${item.color}`} />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{item.label}</p>
                                                            <p className="text-xs font-black text-gray-900 truncate">{item.value}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions Sidebar */}
                                    <div className="lg:col-span-4 flex flex-col gap-3 justify-center relative z-10 pt-6 lg:pt-0 border-t lg:border-t-0 lg:border-l border-gray-100 lg:pl-10">
                                        <button
                                            onClick={() => {
                                                if (kost.location?.lat && kost.location?.lng) {
                                                    window.open(`https://www.google.com/maps/dir/?api=1&destination=${kost.location.lat},${kost.location.lng}`, '_blank');
                                                } else if (kost.locationUrl) {
                                                    window.open(kost.locationUrl, '_blank');
                                                } else {
                                                    alert('Lokasi belum tersedia');
                                                }
                                            }}
                                            className="w-full bg-gray-900 hover:bg-black text-white px-6 py-4 rounded-2xl font-black flex items-center justify-center gap-3 transition-all text-[10px] uppercase tracking-widest shadow-lg active:scale-[0.98] group/btn"
                                        >
                                            <MapPin className="w-4 h-4 text-orange-500 group-hover:scale-110 transition-transform" /> Rute Ke Kost
                                        </button>

                                        {isPaid && (
                                            <>
                                                <div className="flex flex-col gap-1.5">
                                                    <button
                                                        disabled={(kost.daysRemaining || 0) > 7}
                                                        onClick={() => handleOpenExtension(kost)}
                                                        className={`w-full ${(kost.daysRemaining || 0) > 7 ? 'bg-gray-50 text-gray-400 border border-gray-100' : 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-100'} px-6 py-4 rounded-2xl font-black flex items-center justify-center gap-3 transition-all text-[10px] uppercase tracking-widest active:scale-[0.98] group/btn`}
                                                    >
                                                        <Plus className={`w-4 h-4 ${(kost.daysRemaining || 0) > 7 ? 'text-gray-300' : 'text-white'} group-hover:rotate-90 transition-transform`} /> Perpanjang Sewa
                                                    </button>
                                                    {(kost.daysRemaining || 0) > 7 && (
                                                        <p className="text-[8px] font-bold text-gray-400 text-center uppercase tracking-[0.15em]">
                                                            Tersedia dlm {(kost.daysRemaining || 0) - 7} hari
                                                        </p>
                                                    )}
                                                </div>

                                                <button
                                                    onClick={() => handleOpenBill(kost)}
                                                    className="w-full bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-100 px-6 py-4 rounded-2xl font-black flex items-center justify-center gap-3 transition-all text-[10px] uppercase tracking-widest active:scale-[0.98] group/btn"
                                                >
                                                    <Receipt className="w-4 h-4 text-gray-400 group-hover:-rotate-12 transition-transform" /> Lihat Tagihan
                                                </button>
                                            </>
                                        )}

                                        <button
                                            onClick={() => handleOpenChat(kost)}
                                            className="w-full bg-white hover:bg-emerald-50 text-emerald-600 border-2 border-emerald-100 px-6 py-4 rounded-2xl font-black flex items-center justify-center gap-3 transition-all text-[10px] uppercase tracking-widest active:scale-[0.98]"
                                        >
                                            <Smartphone className="w-4 h-4" /> Hubungi Pemilik
                                        </button>

                                        {/* Pending Actions */}
                                        {kost.status === 'AWAITING_PAYMENT' && (
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
                                                className="w-full bg-orange-600 hover:bg-orange-700 text-white p-5 rounded-2xl font-black flex flex-col items-center gap-1 transition-all shadow-xl shadow-orange-200 active:scale-[0.98] animate-pulse"
                                            >
                                                <div className="flex items-center gap-2 text-xs uppercase tracking-widest">
                                                    <Receipt className="w-4 h-4" /> Bayar Sekarang
                                                </div>
                                                <span className="text-[10px] opacity-70 font-bold">{FORMAT_CURRENCY(kost.totalPrice)}</span>
                                            </button>
                                        )}

                                        {kost.status === 'PENDING_APPROVAL' && (
                                            <button
                                                onClick={() => handleCancelBooking(kost)}
                                                className="w-full bg-white border-2 border-gray-100 hover:border-red-500 hover:bg-red-50 hover:text-red-600 text-gray-500 p-4 rounded-2xl font-black flex items-center justify-center gap-3 transition-all text-[10px] uppercase tracking-widest active:scale-[0.98] group/cancel"
                                            >
                                                <XCircle className="w-4 h-4 group-hover/cancel:rotate-90 transition-transform" /> Batalkan Pengajuan
                                            </button>
                                        )}
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

            {/* --- MODALS OVERLAY --- */}

            {/* 1. Modal Perpanjangan Sewa */}
            {showExtensionModal && selectedKost && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white rounded-[3rem] w-full max-w-lg my-auto relative shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="bg-orange-600 p-8 text-white relative">
                            <button onClick={() => setShowExtensionModal(false)} className="absolute top-6 right-6 text-white/70 hover:text-white bg-black/10 hover:bg-black/20 rounded-full p-2 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                            <div className="flex items-center gap-4 mb-3">
                                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                                    <Clock className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black tracking-tight">Perpanjang Sewa</h3>
                                    <p className="text-orange-100/80 text-xs font-bold uppercase tracking-widest">{selectedKost.kostName}</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-8">
                            <div className="space-y-8">
                                {/* Duration Selector */}
                                <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-4">Pilih Durasi Perpanjangan</label>
                                    <div className="flex items-center justify-between bg-white p-2 rounded-2xl border border-gray-200">
                                        <button
                                            type="button"
                                            onClick={() => setExtensionPeriod(Math.max(1, extensionPeriod - 1))}
                                            className="w-12 h-12 flex items-center justify-center bg-gray-900 hover:bg-orange-500 text-white rounded-xl font-black text-lg transition-all active:scale-90 shadow-lg shadow-gray-200"
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
                                            className="w-12 h-12 flex items-center justify-center bg-gray-900 hover:bg-orange-500 text-white rounded-xl font-black text-lg transition-all active:scale-90 shadow-lg shadow-gray-200"
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
                                            <div className="mt-6">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-3">Atau Pilih Paket Hemat</label>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {availablePackages.map((pkg: any) => {
                                                        const meta = selectedKost.metadata || {};
                                                        let currentEp = Number(meta.extraPersonFee || meta.extra_person_fee || meta.additionalCostPerPerson || 0);
                                                        if (!currentEp && selectedKost.totalPrice > pkg.price) {
                                                            currentEp = (selectedKost.totalPrice / selectedKost.duration) - pkg.price;
                                                        }
                                                        const displayPrice = pkg.price + (currentEp > 0 ? currentEp : 0);

                                                        return (
                                                            <button
                                                                key={pkg.period}
                                                                type="button"
                                                                onClick={() => setExtensionPeriod(periodToMonths[pkg.period] || 1)}
                                                                className={`p-4 rounded-2xl border-2 text-left transition-all group ${extensionPeriod === periodToMonths[pkg.period]
                                                                    ? 'border-orange-500 bg-orange-50'
                                                                    : 'border-gray-100 bg-white hover:border-orange-200'
                                                                    }`}
                                                            >
                                                                <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${extensionPeriod === periodToMonths[pkg.period] ? 'text-orange-600' : 'text-gray-400'}`}>
                                                                    Paket {
                                                                        pkg.period === 'bulanan' ? 'Bulanan' :
                                                                            pkg.period === '3bulanan' ? '3 Bulan' :
                                                                                pkg.period === '6bulanan' ? '6 Bulan' :
                                                                                    pkg.period === 'tahunan' ? 'Tahunan' : pkg.period
                                                                    }
                                                                </p>
                                                                <p className="text-sm font-black text-gray-900">{FORMAT_CURRENCY(displayPrice)}</p>
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>

                                {/* Price Breakdown */}
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-2">Rincian Pembayaran Perpanjangan</h4>
                                    <div className="bg-white border-2 border-dashed border-gray-100 rounded-[2rem] p-6 space-y-4">
                                        {(() => {
                                            const meta = selectedKost.metadata || {};
                                            const period = selectedKost.period?.toLowerCase() || 'bulanan';

                                            // Robust extraction with number casting
                                            let bp = Number(meta.basePrice || selectedKost.basePrice || 0);
                                            let ep = Number(meta.extraPersonFee || meta.extra_person_fee || meta.additionalCostPerPerson || 0);

                                            // Fallback for basePrice from composition
                                            if (!bp && meta.composition?.baseRent) {
                                                const dur = Number(meta.extensionPeriod || meta.total_months || 1);
                                                bp = Number(meta.composition.baseRent) / dur;
                                            }

                                            // Fallback for extraPersonFee from composition
                                            if (!ep && meta.composition?.extraPersonFee) {
                                                const dur = Number(meta.extensionPeriod || meta.total_months || 1);
                                                ep = Number(meta.composition.extraPersonFee) / dur;
                                            }

                                            // Derive from property config (Source of Truth)
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

                                            // [FIX] AUTO-CORRECTION: Catch extra person fee missing from meta but present in total price
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
                                            // [FIX] DOUBLE PAYMENT PREVENTION LOGIC
                                            // 1. Calculate target extension date
                                            const nowSim = getCurrentDate();
                                            const leaseEndDate = parseDateSafely(selectedKost.endDate) || nowSim;
                                            const targetDate = new Date(leaseEndDate);
                                            targetDate.setMonth(targetDate.getMonth() + 1);

                                            // 2. Search for existing PAID facility bill for this specific target date
                                            const isAlreadyPaid = (selectedKost.pendingBills || []).some((b: any) => {
                                                const s = (b.status || '').toLowerCase();
                                                const isPaid = ['paid', 'success', 'berhasil', 'settlement', 'capture', 'completed', 'done'].includes(s);
                                                if (!isPaid) return false;

                                                const bMeta = b.metadata || {};
                                                const bName = (b.bill_name || b.name || bMeta.bill_name || bMeta.billName || '').toLowerCase();
                                                const isFac = bName.includes('air') || bName.includes('listrik') || bName.includes('wifi') || bName.includes('fasilitas');
                                                const isBundle = bName.includes('total') || bName.includes('semua') || bMeta.is_batch_split_child || bMeta.is_batch_split_parent || bMeta.is_bundled_parent;
                                                
                                                if (!isFac && !isBundle) return false;
                                                
                                                // [FIX] ROBUST DATE MATCHING
                                                const bDate = parseDateSafely(bMeta.original_due_date || bMeta.simulated_date || b.dueDate || b.due_date || b.created_at);
                                                let isSameMonth = bDate && bDate.getMonth() === targetDate.getMonth() && bDate.getFullYear() === targetDate.getFullYear();

                                                // [NEW] NAME-BASED FALLBACK: If date doesn't match, check if the month name is in the bill name
                                                if (!isSameMonth) {
                                                    const monthMap: any = { 'januari': 0, 'februari': 1, 'maret': 2, 'april': 3, 'mei': 4, 'juni': 5, 'juli': 6, 'agustus': 7, 'september': 8, 'oktober': 9, 'november': 10, 'desember': 11, 'january': 0, 'february': 1, 'march': 2, 'april': 3, 'may': 4, 'june': 5, 'july': 6, 'august': 7, 'september': 8, 'october': 9, 'november': 10, 'december': 11 };
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
                                                // Auto-uncheck if already paid
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

                                                    // [FIX] AUTO-CORRECTION: Catch extra person fee missing from meta but present in total price
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
                            </div>

                            <div className="mt-10 flex gap-4">
                                <button type="button" onClick={() => setShowExtensionModal(false)} className="flex-1 py-4 text-gray-500 font-black uppercase text-[11px] tracking-widest hover:bg-gray-50 rounded-2xl transition-colors border border-gray-100">Batal</button>
                                <button
                                    onClick={() => {
                                        const meta = selectedKost.metadata || {};
                                        const period = selectedKost.period?.toLowerCase() || 'bulanan';

                                        // Robust extraction with number casting
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

                                        // [FIX] AUTO-CORRECTION: Catch extra person fee missing from meta but present in total price
                                        if (selectedKost.totalPrice > bp && ep === 0) {
                                            ep = selectedKost.totalPrice - bp;
                                        }

                                        const monthlyFacility = Number(selectedKost.additionalFeePrice || 0);
                                        const total = ((bp + ep) * extensionPeriod) + (includeFacilityInExtension ? monthlyFacility : 0);

                                        // Generate Month Year Label for Extension
                                        // [FIX] Correct Month Label: Use the NEXT month after lease ends for the label
                                        const nowSim = getCurrentDate();
                                        const leaseEndDate = parseDateSafely(selectedKost.endDate) || nowSim;
                                        
                                        // Start with the day after lease ends
                                        const targetDate = new Date(leaseEndDate);
                                        targetDate.setMonth(targetDate.getMonth() + 1); // [FIX] Shift to NEXT month label
                                        
                                        const monthYear = targetDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

                                        // [FIX] Explicit Name with Month and Duration
                                        const billNameStr = `Sewa Kost ${monthYear} (${extensionPeriod} Bulan)`;

                                        // [FIX] SEARCH FOR EXISTING FACILITY BILL: If checking facility, try to find its ID in DB
                                        let existingFacilityId = null;
                                        if (includeFacilityInExtension) {
                                            // Priority 1: Bill matching the TARGET month (next month)
                                            // Priority 2: Any ACTIVE facility bill (current month/arrears)
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
                                                
                                                // [FIX] ROBUST DATE MATCHING (Consistent with isAlreadyPaid logic)
                                                const bDate = parseDateSafely(bMeta.original_due_date || bMeta.simulated_date || b.dueDate || b.due_date || b.created_at);
                                                let isSameMonth = bDate && bDate.getMonth() === targetDate.getMonth() && bDate.getFullYear() === targetDate.getFullYear();

                                                if (!isSameMonth) {
                                                    const monthMap: any = { 'januari': 0, 'februari': 1, 'maret': 2, 'april': 3, 'mei': 4, 'juni': 5, 'juli': 6, 'agustus': 7, 'september': 8, 'oktober': 9, 'november': 10, 'desember': 11, 'january': 0, 'february': 1, 'march': 2, 'april': 3, 'may': 4, 'june': 5, 'july': 6, 'august': 7, 'september': 8, 'october': 9, 'november': 10, 'december': 11 };
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

                                            const bestMatch = targetMatch || facilityBills[0]; // Fallback to any active facility bill

                                            if (bestMatch) {
                                                existingFacilityId = bestMatch.id;
                                                console.log("FOUND_MATCHING_FACILITY_BILL:", existingFacilityId, bestMatch.bill_name);
                                            }
                                        }

                                        handleStartPayment(total, selectedKost.kostId, 'perpanjangan_sewa', {
                                            extensionPeriod,
                                            masa_sewa_hari: extensionPeriod * 30,
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
                                            existing_facility_id: existingFacilityId,
                                            composition: {
                                                baseRent: bp * extensionPeriod,
                                                extraPersonFee: ep * extensionPeriod,
                                                facilityFee: includeFacilityInExtension ? monthlyFacility : 0,
                                                occupants: Number(meta.occupants || meta.occupantsCount || meta.composition?.occupants || 1)
                                            },
                                            existing_facility_id: existingFacilityId, // [CRITICAL] Link to existing active bill
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
                                                        simulated_date: getCurrentDate().toISOString() // [NEW] Item-level simulator date
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
                                                        simulated_date: getCurrentDate().toISOString() // [CRITICAL] Item-level sync
                                                    }
                                                }] : [])
                                            ],
                                            tenantName: user.displayName || user.email?.split('@')[0] || 'Customer',
                                            propertyTitle: selectedKost.kostName,
                                            roomCategory: selectedKost.roomType,
                                            leaseStart: selectedKost.endDate,
                                            leaseEnd: '-',
                                            isManualExtension: true, // [NEW] Explicit flag for backend trust
                                            simulated_date: getCurrentDate().toISOString() // [CRITICAL] Parent-level sync
                                        });
                                    }}
                                    className="flex-[2] py-4 bg-gray-900 hover:bg-orange-600 text-white font-black uppercase text-[11px] tracking-[0.2em] rounded-2xl shadow-2xl shadow-gray-200 transition-all active:scale-95"
                                >
                                    Bayar Perpanjangan
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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
                                            const monthMap: any = { 'januari': 0, 'februari': 1, 'maret': 2, 'april': 3, 'mei': 4, 'juni': 5, 'juli': 6, 'agustus': 7, 'september': 8, 'oktober': 9, 'november': 10, 'desember': 11, 'january': 0, 'february': 1, 'march': 2, 'april': 3, 'may': 4, 'june': 5, 'july': 6, 'august': 7, 'september': 8, 'october': 9, 'november': 10, 'december': 11 };
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
                                                                        className="px-4 py-2 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-700 transition-all active:scale-95 shadow-sm"
                                                                    >
                                                                        Bayar
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



            {/* 3. Modal Komplain */}
            {showComplaintModal && selectedKost && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-lg my-auto relative shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-red-500 p-6 text-white">
                            <button onClick={() => setShowComplaintModal(false)} className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/10 hover:bg-black/20 rounded-full p-2 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                    <MessageSquare className="w-5 h-5 text-white" />
                                </div>
                                <h3 className="text-xl font-bold">Layanan Komplain Kost</h3>
                            </div>
                            <p className="text-red-100 text-sm opacity-90">Ada kerusakan fasilitas di {selectedKost.kostName}? Laporkan dengan detail di sini.</p>
                        </div>

                        <form onSubmit={submitComplaint} className="p-8 space-y-5">
                            <div>
                                <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Judul Kendala</label>
                                <input
                                    type="text"
                                    required
                                    value={complaintTitle}
                                    onChange={(e) => setComplaintTitle(e.target.value)}
                                    placeholder="Contoh: AC Kamar Bocor atau Air Mati"
                                    className="w-full mt-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Detail Masalah</label>
                                <textarea
                                    rows={4}
                                    required
                                    value={complaintDesc}
                                    onChange={(e) => setComplaintDesc(e.target.value)}
                                    placeholder="Jelaskan secara rinci kerusakan atau masalah yang Anda alami..."
                                    className="w-full mt-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none resize-none"
                                ></textarea>
                            </div>
                            <div>
                                <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Foto Bukti (Opsional)</label>
                                <div className="mt-2 flex items-center gap-4">
                                    <label className="flex-1 cursor-pointer">
                                        <div className="flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-dashed border-gray-200 rounded-xl hover:border-red-500 hover:bg-red-50 transition-all text-gray-400 font-bold text-xs uppercase tracking-widest">
                                            <Plus className="w-4 h-4" /> {complaintPhoto ? 'Ganti Foto' : 'Pilih Foto'}
                                        </div>
                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => setComplaintPhoto(e.target.files?.[0] || null)} />
                                    </label>
                                    {complaintPhoto && (
                                        <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center text-red-600 font-black text-[10px]">
                                            OK
                                        </div>
                                    )}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-4 bg-red-500 hover:bg-red-600 text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-xl shadow-red-100 transition-all active:scale-95 disabled:opacity-50 mt-4"
                            >
                                {isSubmitting ? 'Mengirim...' : 'Kirim Laporan Komplain'}
                            </button>
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

                        // 2. Lease Sync is now handled exclusively by the Pakasir Webhook on the backend
                        // to prevent race conditions and double-duration additions.

                        setShowPaymentGateway(false);
                        alert('Pembayaran Berhasil! Masa sewa Anda telah diperbarui.');
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
                                                                        <span className={`text-[9px] font-bold uppercase tracking-tight truncate ${isChecked ? 'text-gray-900' : 'text-gray-400'}`}>
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

            <TimeSimulator />
        </div>
    );
};

export default MyKost;
