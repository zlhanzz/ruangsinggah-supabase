import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { ArrowLeft, Clock, MapPin, Receipt, Upload, Plus, MessageSquare, AlertCircle, FileText, X, Star, CheckCircle, Smartphone, Calendar, Search, Heart, ChevronRight, XCircle, Zap, Check } from 'lucide-react';
import { Page } from '../types';
import { addPropertyReview, getExtraBills, settlePendingBills, cancelBookingRequest } from '../userService';
import PaymentGateway from '../components/PaymentGateway';
import ChatWindow from '../components/ChatWindow';
import { notifyAdminTransaction } from '../emailService';
import { FORMAT_CURRENCY } from '../constants';

interface MyKostProps {
    user: any;
    onPageChange: (page: Page) => void;
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

const MyKost: React.FC<MyKostProps> = ({ user, onPageChange }) => {
    const [activeKosts, setActiveKosts] = useState<any[]>([]);
    const [surveyRequests, setSurveyRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState<'diajukan' | 'aktif' | 'riwayat'>('diajukan');
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

    useEffect(() => {
        if (user) {
            fetchMyKosts();
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
        try {
            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .eq('user_id', user.uid);

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
                const isRent = doc.product_type === 'rent' || doc.type === 'sewa_kost' || doc.product_type === 'kost_booking' || doc.product_type === 'kost' || !doc.product_type || doc.category === 'kost';
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
                           const diff = end.getTime() - new Date().getTime();
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
                      period: doc.period || metadata.periodLabel,
                      moveInDate: doc.move_in_date || metadata.startDate,
                      endDate: metadata.endDate,
                      daysRemaining: daysRem,
                      totalPrice: doc.amount || doc.total_price,
                      displayImage: displayImg,
                      rejection_reason: metadata.rejection_reason || metadata.rejectionReason,
                      additionalFeePrice: prop?.additional_fee_price,
                      additionalFeeName: prop?.additional_fee_name,
                      additionalFeeStartsFrom: prop?.additional_fee_starts_from,
                      room_types: prop?.room_types,
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
                const isPendingOrAwaiting = ['pending_approval', 'awaiting_payment'].includes(statusLower);
                
                // For pending/awaiting, use a unique key to ensure they don't get hidden by existing PAID records
                // For others, group by kostId to show the "best" status for that property
                const uniqueKey = isPendingOrAwaiting ? `${curr.kostId}_${curr.id}` : curr.kostId;
                
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

            // Fetch extra bills
            const bills = await getExtraBills(user.uid);

            // Associate extra bills with real kosts
            const activeWithBills = uniqueKosts.map(k => {
                const pendBills = (bills || []).filter(b => 
                    (b.product_id === k.kostId || b.kost_id === k.kostId) && 
                    ['pending', 'AWAITING_PAYMENT'].includes(b.status)
                );
                const totalPend = pendBills.reduce((acc, b) => acc + (b.amount || 0), 0);
                return { ...k, pendingBills: pendBills, totalPendingBills: totalPend };
            });

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
            setExtraBills(bills || []);
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
    };

    const handleOpenBill = (kost: any) => {
        setSelectedKost(kost);
        setShowExtraBillModal(true);
    };

    const handleOpenComplaint = (kost: any) => {
        setSelectedKost(kost);
        setShowComplaintModal(true);
    };

    const handleOpenRating = (kost: any) => {
        setSelectedKost(kost);
        setShowRatingModal(true);
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
                .eq('user_id', user.id);
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
            'PENDING_ASSIGNMENT': 'bg-orange-50 text-orange-600 border-orange-100',
            'AGENT_ASSIGNED': 'bg-orange-900 text-white border-transparent',
            'HEADING_TO_LOCATION': 'bg-blue-600 text-white border-transparent',
            'SURVEYING': 'bg-blue-500 text-white border-transparent',
            'SUBMITTED': 'bg-emerald-600 text-white border-transparent animate-pulse',
            'COMPLETED': 'bg-green-600 text-white border-transparent',
            'CANCELLED': 'bg-gray-100 text-gray-400 border-gray-200'
        };

        const statusLabels: any = {
            'AWAITING_PAYMENT': 'Menunggu Pembayaran',
            'PENDING_ASSIGNMENT': 'Mencari Agen Surveyor',
            'AGENT_ASSIGNED': 'Agen Surveyor Ditetapkan',
            'HEADING_TO_LOCATION': 'Surveyor Menuju Lokasi',
            'SURVEYING': 'Sedang Proses Survey',
            'SUBMITTED': 'Laporan Terkirim (Menunggu Konfirmasi)',
            'COMPLETED': 'Survey Selesai',
            'CANCELLED': 'Survey Dibatalkan'
        };

        const currentStatusColor = statusColors[status] || 'bg-gray-50 text-gray-500 border-gray-100';
        const currentLabel = statusLabels[status] || status;

        return (
            <div key={survey.id} className="group relative bg-white/70 backdrop-blur-2xl rounded-[3.5rem] p-8 sm:p-12 border border-white shadow-2xl shadow-gray-200/50 flex flex-col lg:flex-row gap-10 lg:gap-14 hover:scale-[1.01] transition-all duration-500 overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-orange-400/10 to-transparent rounded-full blur-3xl -mr-32 -mt-32 group-hover:from-orange-400/20 transition-all duration-700" />
                
                <div className="flex-1 relative z-10">
                    <div className="flex items-start gap-8 mb-8">
                        <div className="relative">
                            <div className="w-24 h-24 sm:w-28 sm:h-28 bg-white rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-orange-200 border-4 border-white transform rotate-3 group-hover:rotate-0 transition-all duration-500">
                                <Search className="w-12 h-12 text-orange-500" />
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-2xl shadow-lg flex items-center justify-center border-2 border-orange-50">
                                <span className="text-base">⚡</span>
                            </div>
                        </div>

                        <div className="flex-1">
                            <h4 className="text-[10px] font-black text-orange-500 uppercase tracking-[0.3em] mb-2">Layanan Jasa Survey</h4>
                            <h3 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight tracking-tight mb-4">
                                {survey.kost_name || 'Survey Lokasi Kost'}
                            </h3>
                            <div className="flex flex-col gap-3 mt-4 text-gray-500 font-medium text-sm">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-orange-50 rounded-lg"><MapPin className="w-4 h-4 text-orange-500" /></div>
                                    <span className="text-gray-600">{survey.kost_address}</span>
                                </div>
                                {survey.owner_phone && (
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-emerald-50 rounded-lg"><Smartphone className="w-4 h-4 text-emerald-500" /></div>
                                        <span className="text-gray-600 font-bold">Pemilik: {survey.owner_phone}</span>
                                    </div>
                                )}
                                {(survey.survey_date || survey.survey_time) && (
                                    <div className="flex items-center gap-3 font-bold italic">
                                        <div className="p-2 bg-orange-50 rounded-lg"><Calendar className="w-4 h-4 text-orange-500" /></div>
                                        <span className="text-gray-600">
                                            Jadwal: {survey.survey_date ? new Date(survey.survey_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '-'} @ {survey.survey_time || '-'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className={`px-6 py-4 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.15em] flex items-center gap-3 border transition-all duration-500 self-start ${currentStatusColor}`}>
                        <div className={`w-3 h-3 rounded-full animate-pulse bg-current`} />
                        {currentLabel}
                    </div>

                    {survey.agent_name ? (
                        <div className="mt-8 bg-white/50 backdrop-blur-sm p-6 rounded-[2rem] border border-gray-100 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center text-xl font-black text-gray-400 overflow-hidden shrink-0 border-2 border-white shadow-sm">
                                {survey.agent_photo_url ? (
                                    <img src={survey.agent_photo_url} alt={survey.agent_name} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-gray-300">{survey.agent_name.charAt(0)}</span>
                                )}
                            </div>
                            <div className="flex-1">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Surveyor Anda</p>
                                <p className="text-base font-black text-gray-900 leading-none mb-1">{survey.agent_name}</p>
                                <div className="flex items-center gap-1.5">
                                    <div className={`w-1.5 h-1.5 rounded-full ${['COMPLETED', 'SUBMITTED'].includes(status) ? 'bg-emerald-500' : 'bg-blue-500'} animate-pulse`} />
                                    <p className={`text-[10px] font-bold ${['COMPLETED', 'SUBMITTED'].includes(status) ? 'text-emerald-600' : 'text-blue-600'} uppercase tracking-wider`}>
                                        {status === 'SUBMITTED' ? 'Laporan Telah Dikirim' : status === 'COMPLETED' ? 'Survey Selesai' : 'Sedang Bertugas'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : ( 
                        ['AGENT_ASSIGNED', 'HEADING_TO_LOCATION', 'SURVEYING'].includes(status) && (
                            <div className="mt-8 bg-white/50 backdrop-blur-sm p-6 rounded-[2rem] border border-gray-100 flex items-center gap-4 animate-pulse">
                                <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-xl font-black text-gray-200 border-2 border-white">
                                    S
                                </div>
                                <div className="space-y-2">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Surveyor Anda</p>
                                    <div className="h-4 bg-gray-100 rounded-md w-32" />
                                </div>
                            </div>
                        )
                    )}

                    {['AGENT_ASSIGNED', 'HEADING_TO_LOCATION', 'SURVEYING'].includes(status) && (
                        <div className="mt-4 bg-orange-50/50 border border-orange-100 p-4 rounded-3xl flex items-center gap-4 transition-all hover:bg-orange-50 animate-in fade-in slide-in-from-top-4 duration-500">
                            <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-orange-50 shrink-0">
                                <AlertCircle className="w-5 h-5 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-1">Informasi Penting</p>
                                <p className="text-[11px] font-bold text-gray-700 leading-tight">
                                    Mohon standby! Agen kami mungkin akan menghubungi Anda via Chat atau Video Call untuk verifikasi lokasi secara langsung.
                                </p>
                            </div>
                        </div>
                    )}

                    {['COMPLETED', 'SUBMITTED'].includes(status) && survey.evaluation_summary && (
                        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[
                                { id: 'room_facilities', icon: '🛏️', label: 'Kamar' },
                                { id: 'bathroom_facilities', icon: '🚿', label: 'WC' },
                                { id: 'security_check', icon: '🛡️', label: 'Keamanan' },
                                { id: 'wifi_check', icon: '📶', label: 'WiFi' },
                            ].map(item => (
                                <div key={item.id} className="bg-gray-50/50 border border-gray-100 p-3 rounded-2xl">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <span>{item.icon}</span>
                                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{item.label}</span>
                                    </div>
                                    <p className="text-[10px] font-bold text-gray-700 truncate">
                                        {survey.evaluation_summary[item.id] || 'N/A'}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-6 lg:w-80 shrink-0 justify-center relative z-10 pt-4">
                    {status === 'AWAITING_PAYMENT' ? (
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
                            className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-6 rounded-[2rem] font-black flex flex-col items-center justify-center gap-1 transition-all text-sm shadow-2xl shadow-orange-200 active:scale-95 animate-subtle-bounce"
                        >
                            <div className="flex items-center gap-3">
                                <Receipt className="w-6 h-6" /> BAYAR SURVEY SEKARANG
                            </div>
                            <span className="text-[10px] opacity-80 font-bold uppercase tracking-widest">Rp 70.000 (Satu kali bayar)</span>
                        </button>
                    ) : status === 'SUBMITTED' ? (
                        <button
                            onClick={() => handleConfirmSurvey(survey.id)}
                            disabled={isSubmitting}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-6 rounded-[2rem] font-black flex flex-col items-center justify-center gap-1 transition-all text-sm shadow-2xl shadow-emerald-200 active:scale-95 animate-pulse"
                        >
                            <div className="flex items-center gap-3">
                                <CheckCircle className="w-6 h-6" /> KONFIRMASI SELESAI
                            </div>
                            <span className="text-[10px] opacity-80 font-bold uppercase tracking-widest">Klik jika hasil survey sudah sesuai</span>
                        </button>
                    ) : status === 'COMPLETED' && survey.result_drive_link ? (
                        <button
                            onClick={() => {
                                // Safety parse if evaluation_summary is string
                                let parsedSummary = survey.evaluation_summary;
                                if (typeof survey.evaluation_summary === 'string') {
                                    try {
                                        parsedSummary = JSON.parse(survey.evaluation_summary);
                                    } catch (e) {
                                        console.error("Error parsing evaluation_summary", e);
                                        parsedSummary = {};
                                    }
                                }
                                setSelectedSurvey({ ...survey, evaluation_summary: parsedSummary });
                                setShowSurveySummaryModal(true);
                            }}
                            className="bg-gray-900 hover:bg-emerald-600 text-white px-8 py-6 rounded-[2rem] font-black flex items-center justify-center gap-3 transition-all text-sm shadow-2xl shadow-gray-300 active:scale-95 group/drive"
                        >
                            <FileText className="w-6 h-6 group-hover/drive:-translate-y-1 transition-transform" /> LIHAT HASIL SURVEY
                        </button>
                    ) : (
                        <div className="p-8 text-center bg-gray-50 rounded-[2.5rem] border border-dashed border-gray-200">
                            <span className="text-2xl block mb-3">⚡</span>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-relaxed">
                                {status === 'PENDING_ASSIGNMENT' ? 'Pesanan Sedang Diproses Admin' : 
                                 status === 'AGENT_ASSIGNED' ? 'Surveyor Sedang Mempersiapkan' :
                                 status === 'HEADING_TO_LOCATION' ? 'Surveyor Sedang Menuju Lokasi' :
                                 status === 'SURVEYING' ? 'Surveyor Sedang Mengambil Foto & Video' :
                                 'Mohon Tunggu Sebentar'}
                            </p>
                        </div>
                    )}

                    {['AGENT_ASSIGNED', 'HEADING_TO_LOCATION', 'SURVEYING'].includes(status) && (
                        <button
                            onClick={() => {
                                if (survey.agent_phone) {
                                    const cleanPhone = survey.agent_phone.replace(/\D/g, '');
                                    const finalPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.substring(1) : cleanPhone;
                                    window.open(`https://wa.me/${finalPhone}`, '_blank');
                                } else {
                                    alert('Mohon tunggu, nomor WhatsApp agen sedang disiapkan oleh sistem.');
                                }
                            }}
                            className={`w-full ${survey.agent_phone ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-100 hover:-translate-y-1' : 'bg-gray-100 text-gray-400 cursor-not-allowed'} px-4 py-5 rounded-[1.5rem] font-black flex items-center justify-center gap-3 transition-all text-sm uppercase tracking-widest active:scale-95`}
                        >
                            <Smartphone className="w-5 h-5" />
                            {survey.agent_phone ? 'Chat Surveyor via WA' : 'WA Belum Tersedia'}
                        </button>
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
                        onClick={() => onPageChange(Page.LOGIN)}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl shadow-orange-200 transition-all active:scale-95 flex items-center justify-center gap-3"
                    >
                        MASUK / DAFTAR
                        <ChevronRight className="w-5 h-5" />
                    </button>
                    <button 
                         onClick={() => onPageChange(Page.HOME)}
                         className="mt-6 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-orange-500 transition-colors"
                    >
                        Kembali ke Beranda
                    </button>
                </div>
            </div>
        );
    }

    const filteredKosts = activeKosts.filter(kost => {
        const s = (kost.status || '').toUpperCase();
        const isPaid = ['APPROVED', 'PAID', 'SELESAI', 'SUCCESS', 'BERHASIL'].includes(s);
        const isPending = ['PENDING_APPROVAL', 'AWAITING_PAYMENT', 'PENDING'].includes(s);
        
        if (activeTab === 'diajukan') return isPending || s === 'REJECTED' || s === 'CANCELLED';
        
        if (activeTab === 'aktif') {
            if (!isPaid) return false;
            if (!kost.endDate) return true; // Anggap aktif jika tidak ada tanggal selesai
            const eDate = new Date(kost.endDate);
            if (isNaN(eDate.getTime())) return true; // Anggap aktif jika format tanggal salah tapi sudah dibayar
            return new Date() <= eDate;
        }
        
        if (activeTab === 'riwayat') {
            if (s === 'REJECTED' || s === 'CANCELLED') return true;
            if (!isPaid) return false;
            if (!kost.endDate) return false;
            const eDate = new Date(kost.endDate);
            if (isNaN(eDate.getTime())) return false;
            return new Date() > eDate;
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
        <div className="min-h-screen bg-[#F8FAFC] pt-20 pb-12 font-outfitSelection">
            {/* Background Decorations */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-orange-100/30 rounded-full blur-[120px]" />
                <div className="absolute top-[20%] -left-[10%] w-[30%] h-[30%] bg-blue-100/20 rounded-full blur-[100px]" />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div>
                        <div className="flex items-center gap-4 mb-4">
                            <button 
                                onClick={() => onPageChange(Page.HOME)}
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
                    <div className="bg-gray-100/50 p-1.5 rounded-[2rem] flex items-center gap-1 self-start md:self-auto border border-gray-100/80 backdrop-blur-sm">                        {[
                            { id: 'diajukan', label: 'Diajukan', count: activeKosts.filter(k => {
                                const s = (k.status || '').toLowerCase();
                                return ['pending_approval', 'awaiting_payment'].includes(s);
                            }).length + surveyRequests.filter(s => ['PENDING_ASSIGNMENT', 'AWAITING_PAYMENT'].includes(s.status)).length },
                            { id: 'aktif', label: 'Aktif', count: activeKosts.filter(k => {
                                const s = (k.status || '').toLowerCase();
                                const isPaid = ['approved', 'paid', 'selesai', 'success', 'berhasil'].includes(s);
                                return isPaid && (!k.endDate || new Date() <= new Date(k.endDate));
                            }).length + surveyRequests.filter(s => ['AGENT_ASSIGNED', 'HEADING_TO_LOCATION', 'SURVEYING'].includes(s.status)).length },
                            { id: 'riwayat', label: 'Riwayat', count: activeKosts.filter(k => {
                                const s = (k.status || '').toLowerCase();
                                const isPaid = ['approved', 'paid', 'selesai', 'success', 'berhasil'].includes(s);
                                const isInactive = ['rejected', 'cancelled'].includes(s);
                                return (isPaid && k.endDate && new Date() > new Date(k.endDate)) || isInactive;
                            }).length + surveyRequests.filter(s => ['COMPLETED', 'CANCELLED'].includes(s.status)).length }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`px-6 py-3.5 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.15em] transition-all duration-300 flex items-center gap-2.5 ${
                                    activeTab === tab.id 
                                    ? 'bg-white text-orange-500 shadow-xl shadow-orange-100/50 border border-orange-100' 
                                    : 'text-gray-400 hover:text-gray-600 hover:bg-white/50'
                                }`}
                            >
                                {tab.label}
                                {tab.count > 0 && (
                                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] ${activeTab === tab.id ? 'bg-orange-100 text-orange-600' : 'bg-gray-200 text-gray-500'}`}>
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
                            const isPaid = ['approved', 'paid', 'selesai', 'success', 'berhasil'].includes(statusLower);
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
                                                    onClick={() => onPageChange(`${Page.DETAIL}?kostId=${kost.kostId}` as any)}
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
                                <div key={kost.id} className="group relative bg-white rounded-[4rem] p-8 sm:p-12 border border-gray-100 shadow-2xl shadow-orange-900/5 hover:shadow-orange-900/10 transition-all duration-700 overflow-hidden flex flex-col lg:grid lg:grid-cols-12 gap-12 sm:gap-16">
                                {/* Decorative Gradient Overlay */}
                                <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-orange-400/5 to-transparent rounded-full blur-3xl -mr-40 -mt-40 group-hover:from-orange-400/10 transition-all duration-700 pointer-events-none" />
                                
                                <div className="lg:col-span-8 flex flex-col gap-10">
                                    <div className="flex flex-col items-center gap-8 sm:gap-12 w-full text-center">
                                        <div className="relative group/img w-full max-w-[280px] sm:max-w-md">
                                            <div className="aspect-[4/3] w-full bg-white rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-orange-100 border-4 border-white transform hover:rotate-1 transition-all duration-700 overflow-hidden">
                                                {kost.displayImage ? (
                                                    <img src={kost.displayImage} className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-1000" alt={kost.kostName} />
                                                ) : (
                                                    <MapPin className="w-16 h-16 text-orange-500" />
                                                )}
                                            </div>
                                            <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-white rounded-3xl shadow-2xl flex items-center justify-center border-4 border-orange-50 z-20">
                                                <span className="text-3xl animate-bounce">⚡</span>
                                            </div>
                                        </div>
                                        
                                        <div className="flex-1 min-w-0 flex flex-col items-center w-full">
                                            <button 
                                                onClick={() => onPageChange(`${Page.DETAIL}?kostId=${kost.kostId}` as any)}
                                                className="text-4xl sm:text-6xl font-black text-gray-900 leading-tight tracking-tight hover:text-orange-500 transition-colors group/title flex flex-col items-center gap-2 mb-8"
                                            >
                                                <span className="uppercase">{kost.kostName || 'Kost Tersembunyi'}</span>
                                                <ChevronRight className="w-8 h-8 opacity-0 -translate-y-2 group-hover/title:opacity-100 group-hover/title:translate-y-0 transition-all text-orange-500 shrink-0" />
                                            </button>

                                            <div className="flex flex-wrap items-center justify-center gap-3 w-full">
                                                {/* Rating only appears after 1 month of stay */}
                                                {(() => {
                                                    const startDate = new Date(kost.moveInDate || new Date());
                                                    const now = new Date();
                                                    const diffDays = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                                                    
                                                    if (isPaid && diffDays >= 30) {
                                                        return (
                                                            <div className="flex items-center gap-1.5 bg-white px-5 py-3 rounded-2xl border border-gray-100 shadow-xl shadow-gray-100/50">
                                                                {[1, 2, 3, 4, 5].map((s) => (
                                                                    <Star key={s} className="w-4 h-4 text-orange-400 fill-orange-400" />
                                                                ))}
                                                                <span className="text-[11px] font-black text-gray-900 ml-2 uppercase tracking-widest">Beri Ulasan</span>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                })()}
                                                
                                                {kost.daysRemaining !== null && isPaid && (
                                                    <div className={`px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-3 border shadow-sm ${
                                                        kost.daysRemaining <= 7 ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                    }`}>
                                                        <div className={`w-3 h-3 rounded-full ${kost.daysRemaining <= 7 ? 'bg-red-500 animate-ping' : 'bg-emerald-500'}`} />
                                                        {kost.daysRemaining < 0 ? 'Masa Sewa Habis' : `${kost.daysRemaining} Hari Tersisa`}
                                                    </div>
                                                )}

                                                <span className="bg-gray-50 px-6 py-3 rounded-2xl text-[11px] font-black text-gray-600 uppercase tracking-widest border border-gray-100">
                                                    {kost.roomType || 'Standard Room'}
                                                </span>

                                                {isPaid && (
                                                    <span className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-6 py-3 rounded-2xl border border-emerald-100 text-[11px] font-black uppercase tracking-widest">
                                                        <CheckCircle className="w-4 h-4" /> SEDANG DISEWA
                                                    </span>
                                                )}

                                                {statusLower === 'cancelled' && (
                                                    <span className="flex items-center gap-2 text-gray-400 bg-gray-50 px-6 py-3 rounded-2xl border border-gray-100 text-[11px] font-black uppercase tracking-widest">
                                                        <XCircle className="w-4 h-4" /> PENGAJUAN DIBATALKAN
                                                    </span>
                                                )}

                                                {statusLower === 'pending_approval' && (
                                                    <span className="flex items-center gap-2 text-amber-600 bg-amber-50 px-6 py-3 rounded-2xl border border-amber-100 text-[11px] font-black uppercase tracking-widest">
                                                        <Clock className="w-4 h-4 animate-pulse" /> MENUNGGU PERSETUJUAN
                                                    </span>
                                                )}

                                                {statusLower === 'awaiting_payment' && (
                                                    <span className="flex items-center gap-2 text-orange-600 bg-orange-50 px-6 py-3 rounded-2xl border border-orange-100 text-[11px] font-black uppercase tracking-widest">
                                                        <Zap className="w-4 h-4" /> MENUNGGU PEMBAYARAN
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stats Grid - Large 2x2 Layout for Clarity */}
                                    {isPaid && (
                                        <div className="bg-gradient-to-br from-gray-50/50 to-white/50 p-8 sm:p-10 rounded-[3rem] border border-gray-100 shadow-inner grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 items-start w-full">
                                            <div className="flex items-center gap-6">
                                                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg shrink-0">
                                                    <Clock className="w-7 h-7 text-orange-600" />
                                                </div>
                                                <div className="flex flex-col gap-1.5">
                                                    <span className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Durasi Sewa</span>
                                                    <span className="text-xl font-black text-gray-900 whitespace-nowrap">{kost.duration || 1} {kost.period || 'Bulan'}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-6">
                                                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg shrink-0">
                                                    <FileText className="w-7 h-7 text-blue-600" />
                                                </div>
                                                <div className="flex flex-col gap-1.5">
                                                    <span className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Tanggal Mulai</span>
                                                    <span className="text-xl font-black text-gray-900 whitespace-nowrap">
                                                        {FORMAT_DATE(kost.moveInDate)}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-6">
                                                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg shrink-0">
                                                    <Calendar className="w-7 h-7 text-rose-600" />
                                                </div>
                                                <div className="flex flex-col gap-1.5">
                                                    <span className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Masa Selesai</span>
                                                    <span className="text-xl font-black text-gray-900 whitespace-nowrap">
                                                        {FORMAT_DATE(kost.endDate)}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-6">
                                                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg shrink-0">
                                                    <Receipt className="w-7 h-7 text-emerald-600" />
                                                </div>
                                                <div className="flex flex-col gap-1.5">
                                                    <span className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Total Tagihan</span>
                                                    <span className="text-xl font-black text-emerald-600 whitespace-nowrap">
                                                        {FORMAT_CURRENCY(kost.totalPrice || 0)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="lg:col-span-4 flex flex-col gap-4 justify-center relative z-10">
                                    <button 
                                        onClick={() => {
                                            if (kost.location?.lat && kost.location?.lng) {
                                                // Using Google Maps Directions API URL to automatically trigger routing from user's current location
                                                window.open(`https://www.google.com/maps/dir/?api=1&destination=${kost.location.lat},${kost.location.lng}`, '_blank');
                                            } else if (kost.locationUrl) {
                                                window.open(kost.locationUrl, '_blank');
                                            } else {
                                                alert('Lokasi belum tersedia');
                                            }
                                        }}
                                        className="w-full bg-gray-900 hover:bg-black text-white px-8 py-5 rounded-3xl font-black flex items-center justify-center gap-4 transition-all text-xs uppercase tracking-[0.2em] shadow-xl active:scale-95 group/btn"
                                    >
                                        <MapPin className="w-5 h-5 group-hover:scale-110 transition-transform" /> RUTE KE LOKASI KOST
                                    </button>

                                    {isPaid && (
                                        <div className="flex flex-col gap-2">
                                            <button 
                                                disabled={(kost.daysRemaining || 0) > 7}
                                                onClick={() => handleOpenExtension(kost)}
                                                className={`w-full ${ (kost.daysRemaining || 0) > 7 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-200 shadow-2xl' } px-8 py-7 rounded-3xl font-black flex items-center justify-center gap-4 transition-all text-sm uppercase tracking-[0.2em] active:scale-95 group/btn`}
                                            >
                                                <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform" /> PERPANJANG SEWA
                                            </button>
                                            {(kost.daysRemaining || 0) > 7 && (
                                                <p className="text-[9px] font-bold text-gray-400 text-center uppercase tracking-widest">
                                                    Tersedia dlm { (kost.daysRemaining || 0) - 7 } hari lagi
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {isPaid && (
                                        <button 
                                            onClick={() => handleOpenBill(kost)}
                                            className="w-full bg-[#1a1a1a] hover:bg-gray-800 text-white px-8 py-5 rounded-3xl font-black flex items-center justify-center gap-4 transition-all text-xs uppercase tracking-[0.2em] shadow-xl active:scale-95 group/btn"
                                        >
                                            <Receipt className="w-5 h-5 group-hover:-rotate-12 transition-transform" /> LIHAT TAGIHAN
                                        </button>
                                    )}

                                    <div className="grid grid-cols-1 gap-4 mt-4">
                                        <button 
                                            onClick={() => handleOpenChat(kost)}
                                            className="w-full bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-100 px-8 py-5 rounded-3xl font-black flex items-center justify-center gap-4 transition-all text-[11px] uppercase tracking-widest active:scale-95"
                                        >
                                            <Smartphone className="w-5 h-5" /> HUBUNGI PEMILIK
                                        </button>

                                    {/* Action Buttons for Pending/Awaiting States */}
                                    {kost.status === 'AWAITING_PAYMENT' && (
                                        <button 
                                            onClick={() => {
                                                setPaymentAmount(kost.totalPrice);
                                                setPaymentOrderId(kost.id);
                                                setPaymentProductId(kost.kostId);
                                                setPaymentProductType('kost_booking');
                                                setPaymentMetadata({
                                                    kostName: kost.kostName
                                                });
                                                setShowPaymentGateway(true);
                                            }}
                                            className="w-full bg-orange-600 hover:bg-orange-700 text-white px-4 py-4 rounded-2xl font-black flex items-center justify-center gap-3 transition-all text-[11px] mt-4 shadow-xl shadow-orange-200 active:scale-95 animate-pulse"
                                        >
                                            <Receipt className="w-4 h-4" /> BAYAR SEKARANG
                                        </button>
                                    )}

                                    {kost.status === 'PENDING_APPROVAL' && (
                                        <button
                                            onClick={() => handleCancelBooking(kost)}
                                            className="w-full bg-white border-2 border-gray-100 hover:border-red-500 hover:bg-red-50 hover:text-red-600 text-gray-500 px-4 py-4 rounded-2xl font-black flex items-center justify-center gap-3 transition-all text-[11px] mt-4 group/cancel"
                                        >
                                            <XCircle className="w-4 h-4 group-hover/cancel:rotate-90 transition-transform" /> BATALKAN PENGAJUAN
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
                            onClick={() => onPageChange(Page.LISTINGS)}
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
                                            className="w-12 h-12 flex items-center justify-center bg-gray-50 hover:bg-orange-500 hover:text-white rounded-xl text-gray-700 font-bold transition-all active:scale-90"
                                        >
                                            -
                                        </button>
                                        <div className="text-center">
                                            <span className="text-2xl font-black text-gray-900">{extensionPeriod}</span>
                                            <span className="text-sm font-bold text-gray-500 ml-2">{selectedKost.period || 'Bulan'}</span>
                                        </div>
                                        <button 
                                            type="button" 
                                            onClick={() => setExtensionPeriod(extensionPeriod + 1)} 
                                            className="w-12 h-12 flex items-center justify-center bg-gray-50 hover:bg-orange-500 hover:text-white rounded-xl text-gray-700 font-bold transition-all active:scale-90"
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
                                                    {availablePackages.map((pkg: any) => (
                                                        <button
                                                            key={pkg.period}
                                                            type="button"
                                                            onClick={() => setExtensionPeriod(periodToMonths[pkg.period] || 1)}
                                                            className={`p-4 rounded-2xl border-2 text-left transition-all group ${
                                                                extensionPeriod === periodToMonths[pkg.period] 
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
                                                            <p className="text-sm font-black text-gray-900">{FORMAT_CURRENCY(pkg.price)}</p>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>

                                {/* Price Breakdown */}
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-2">Rincian Pembayaran Perpanjangan</h4>
                                    <div className="bg-white border-2 border-dashed border-gray-100 rounded-[2rem] p-6 space-y-4">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-500 font-medium">Sewa Kost & Penghuni ({extensionPeriod} {selectedKost.period || 'Bulan'})</span>
                                            <span className="text-gray-900 font-black">
                                                {(() => {
                                                    const meta = selectedKost.metadata || {};
                                                    const monthlyFacility = selectedKost.additionalFeePrice || 0;
                                                    const rentTotal = (meta.basePrice || 0) + (meta.extraPersonFee || 0) || ((selectedKost.totalPrice / (selectedKost.duration || 1)) - monthlyFacility);
                                                    return FORMAT_CURRENCY(rentTotal * extensionPeriod);
                                                })()}
                                            </span>
                                        </div>

                                        {selectedKost.additionalFeePrice > 0 && (
                                            <div 
                                                className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer ${includeFacilityInExtension ? 'border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-100' : 'border-gray-100 bg-gray-50'}`}
                                                onClick={() => setIncludeFacilityInExtension(!includeFacilityInExtension)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${includeFacilityInExtension ? 'bg-emerald-500 text-white' : 'bg-white border-2 border-gray-200'}`}>
                                                        {includeFacilityInExtension && <Check className="w-4 h-4 stroke-[4]" />}
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-gray-900 uppercase tracking-wider">Bayar Tagihan Fasilitas?</p>
                                                        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">{selectedKost.additionalFeeName || 'Listrik, Air, Wifi'}</p>
                                                    </div>
                                                </div>
                                                <span className="text-[11px] font-black text-emerald-600">
                                                    + {FORMAT_CURRENCY(selectedKost.additionalFeePrice)}
                                                </span>
                                            </div>
                                        )}
                                        
                                        <div className="flex justify-between items-center pt-2">
                                            <span className="text-gray-900 font-black uppercase tracking-widest text-xs">Total Pembayaran</span>
                                            <span className="text-2xl font-black text-orange-600">
                                                {(() => {
                                                    const meta = selectedKost.metadata || {};
                                                    const monthlyFacility = selectedKost.additionalFeePrice || 0;
                                                    const rentTotal = (meta.basePrice || 0) + (meta.extraPersonFee || 0) || ((selectedKost.totalPrice / (selectedKost.duration || 1)) - monthlyFacility);
                                                    const total = (rentTotal * extensionPeriod) + (includeFacilityInExtension ? monthlyFacility : 0);
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
                                        const monthlyFacility = selectedKost.additionalFeePrice || 0;
                                        const rentTotal = (meta.basePrice || 0) + (meta.extraPersonFee || 0) || ((selectedKost.totalPrice / (selectedKost.duration || 1)) - monthlyFacility);
                                        const total = (rentTotal * extensionPeriod) + (includeFacilityInExtension ? monthlyFacility : 0);
                                        
                                        handleStartPayment(total, selectedKost.kostId, 'kost_booking', {
                                            extensionPeriod,
                                            extensionType: 'manual_extension',
                                            includeFacility: includeFacilityInExtension,
                                            facilityAmount: includeFacilityInExtension ? monthlyFacility : 0,
                                            kostName: selectedKost.kostName,
                                            startDate: selectedKost.endDate
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
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white rounded-[3rem] w-full max-w-lg my-auto relative shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        {/* Invoice Header */}
                        <div className="bg-[#1a1a1a] p-8 text-white relative">
                            <button onClick={() => setShowExtraBillModal(false)} className="absolute top-6 right-6 text-white/50 hover:text-white bg-white/10 rounded-full p-2 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <div className="flex items-center gap-2 mb-2 text-orange-500">
                                        <FileText className="w-5 h-5 font-black" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Official Invoice</span>
                                    </div>
                                    <h3 className="text-2xl font-black tracking-tight">Tagihan</h3>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">ID Kost</p>
                                    <p className="text-xs font-bold text-gray-300">{selectedKost.kostId?.substring(0, 8).toUpperCase()}</p>
                                </div>
                            </div>
                            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Nama Properti</p>
                                <p className="text-sm font-bold text-white mb-1">{selectedKost.kostName}</p>
                                <p className="text-[10px] text-gray-400 font-medium italic">{selectedKost.roomType || 'Tipe Kamar Standard'}</p>
                            </div>
                        </div>

                        <div className="p-8">
                            <div className="space-y-6">
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-2">Item Tagihan</h4>
                                
                                {(() => {
                                    const allBills = [...(selectedKost.pendingBills || [])];
                                    const today = new Date();
                                    
                                    // 1. Process existing bills from DB (Additional Fees / Tagihan Ekstra)
                                    const processedExtraBills = allBills.map(bill => {
                                        const statusLower = (bill.status || '').toLowerCase();
                                        const isPaid = ['paid', 'success', 'berhasil'].includes(statusLower);
                                        const createdAt = new Date(bill.created_at);
                                        
                                        // Due date is usually 10 days after creation
                                        const dueDate = new Date(createdAt);
                                        dueDate.setDate(dueDate.getDate() + 10);
                                        
                                        let penalty = 0;
                                        if (!isPaid && today > dueDate) {
                                            const diffDays = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
                                            penalty = (bill.amount || 0) * 0.05 * diffDays;
                                        }

                                        const total = (bill.amount || 0) + penalty;
                                        
                                        let displayType = 'upcoming'; // Blue
                                        if (isPaid) displayType = 'history'; // Gray
                                        else if (today >= createdAt) displayType = 'active'; // Green

                                        return {
                                            ...bill,
                                            penalty,
                                            total,
                                            displayType,
                                            dueDate,
                                            isRent: false
                                        };
                                    });

                                    // 2. Virtual Rent Bill Generation logic
                                    const moveInDate = new Date(selectedKost.moveInDate);
                                    const period = selectedKost.period?.toLowerCase() || 'bulanan';
                                    const meta = selectedKost.metadata || {};
                                    
                                    let monthsPerCycle = 1;
                                    if (period === '3bulanan') monthsPerCycle = 3;
                                    else if (period === '6bulanan') monthsPerCycle = 6;
                                    else if (period === 'tahunan') monthsPerCycle = 12;

                                    // Calculate rentTotal = Base Price + Extra Person Fee
                                    // These values from meta are already for the full 'period'
                                    let rentTotal = (meta.basePrice || 0) + (meta.extraPersonFee || 0);
                                    
                                    if (!rentTotal) {
                                        // Fallback for older bookings
                                        const total = selectedKost.totalPrice || 0;
                                        const dur = selectedKost.duration || 1;
                                        const monthlyTotal = total / dur;
                                        const monthlyFacility = selectedKost.additionalFeePrice || 0;
                                        rentTotal = (monthlyTotal - monthlyFacility) * monthsPerCycle;
                                    }

                                    // Calculate next rent date based on package
                                    const nextRentDate = new Date(moveInDate);
                                    nextRentDate.setMonth(nextRentDate.getMonth() + monthsPerCycle);
                                    
                                    // Rent bill is always "Awaiting Payment" if not yet extended
                                    const isRentDueSoon = selectedKost.daysRemaining <= 7;
                                    
                                    const virtualRentBill = {
                                        id: 'v-rent',
                                        bill_name: `Sewa Kost & Penghuni Tambahan (${monthsPerCycle} Bulan)`,
                                        amount: rentTotal,
                                        displayType: isRentDueSoon ? 'active' : 'upcoming',
                                        isRent: true,
                                        penalty: 0,
                                        total: rentTotal,
                                        dateLabel: `Jatuh Tempo: ${nextRentDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`
                                    };

                                    // 3. Virtual Monthly Facility Fee (Stacking Logic)
                                    if (selectedKost.additionalFeePrice > 0) {
                                        const start = new Date(moveInDate);
                                        const end = new Date(today);
                                        
                                        // Calculate months passed since move-in
                                        const totalMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
                                        
                                        // Iterate through each month from start to current + 1 month (Upcoming)
                                        for (let i = 1; i <= totalMonths + 1; i++) {
                                            const currentBillDate = new Date(start);
                                            currentBillDate.setMonth(start.getMonth() + i);
                                            
                                            const hasBillForThisMonth = processedExtraBills.some(b => {
                                                const bDate = new Date(b.created_at);
                                                return bDate.getMonth() === currentBillDate.getMonth() && bDate.getFullYear() === currentBillDate.getFullYear();
                                            });

                                            if (!hasBillForThisMonth) {
                                                // Create virtual bill for this month
                                                const billCreatedAt = new Date(currentBillDate);
                                                billCreatedAt.setHours(0,0,0,0);
                                                
                                                const billDueDate = new Date(billCreatedAt);
                                                billDueDate.setDate(billDueDate.getDate() + 10);
                                                
                                                const isUpcoming = currentBillDate > today;
                                                
                                                let penalty = 0;
                                                if (!isUpcoming && today > billDueDate) {
                                                    const diffDays = Math.floor((today.getTime() - billDueDate.getTime()) / (1000 * 60 * 60 * 24));
                                                    penalty = (selectedKost.additionalFeePrice || 0) * 0.05 * diffDays;
                                                }
                                                
                                                processedExtraBills.push({
                                                    id: `v-fac-${i}`,
                                                    bill_name: `Fasilitas: ${selectedKost.additionalFeeName || 'Listrik, Air, Wifi'} (${currentBillDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })})`,
                                                    amount: selectedKost.additionalFeePrice,
                                                    displayType: isUpcoming ? 'upcoming' : 'active',
                                                    isRent: false,
                                                    penalty,
                                                    total: selectedKost.additionalFeePrice + penalty,
                                                    created_at: billCreatedAt.toISOString(),
                                                    dueDate: billDueDate,
                                                    dateLabel: `Jatuh Tempo: ${billDueDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`,
                                                    isVirtual: true
                                                } as any);
                                            }
                                        }
                                    }

                                    const allItems = [...processedExtraBills, virtualRentBill].sort((a, b) => {
                                        const order: any = { 'active': 0, 'upcoming': 1, 'history': 2 };
                                        return order[a.displayType] - order[b.displayType];
                                    });

                                    const activeTotal = allItems
                                        .filter(item => item.displayType === 'active')
                                        .reduce((sum, item) => sum + item.total, 0);

                                    return (
                                        <div className="space-y-6">
                                            <div className="space-y-3">
                                                {allItems.map((item: any, idx: number) => {
                                                    const isHistory = item.displayType === 'history';
                                                    const isActive = item.displayType === 'active';
                                                    
                                                    const bgColor = isHistory ? 'bg-gray-50' : isActive ? 'bg-emerald-50' : 'bg-blue-50';
                                                    const borderColor = isHistory ? 'border-gray-100' : isActive ? 'border-emerald-100' : 'border-blue-100';
                                                    const textColor = isHistory ? 'text-gray-400' : isActive ? 'text-emerald-600' : 'text-blue-600';
                                                    const accentColor = isHistory ? 'bg-gray-200' : isActive ? 'bg-emerald-500' : 'bg-blue-500';

                                                    return (
                                                        <div key={item.id || idx} className={`${bgColor} ${borderColor} border rounded-3xl p-6 transition-all relative overflow-hidden group`}>
                                                            <div className="flex justify-between items-start">
                                                                <div className="flex gap-4">
                                                                    <div className={`w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}>
                                                                        <Receipt className={`w-5 h-5 ${textColor}`} />
                                                                    </div>
                                                                    <div>
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <div className={`w-1.5 h-1.5 rounded-full ${accentColor} ${isActive ? 'animate-pulse' : ''}`} />
                                                                            <p className={`text-[9px] font-black uppercase tracking-widest ${textColor}`}>
                                                                                {isHistory ? 'LUNAS' : isActive ? 'TAGIHAN AKTIF' : 'TAGIHAN SELANJUTNYA'}
                                                                            </p>
                                                                        </div>
                                                                        <h5 className="text-xs font-black text-gray-900">{item.bill_name}</h5>
                                                                        <p className="text-[9px] text-gray-500 font-bold mt-1">
                                                                            {item.dateLabel || (isHistory ? 'Dibayar pada ' : 'Periode: ') + new Date(item.created_at || item.updated_at || Date.now()).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className={`text-base font-black ${isHistory ? 'text-gray-400' : 'text-gray-900'}`}>
                                                                        {FORMAT_CURRENCY(item.total)}
                                                                    </p>
                                                                    {item.penalty > 0 && (
                                                                        <p className="text-[8px] text-red-500 font-black uppercase mt-1">
                                                                            + Denda {FORMAT_CURRENCY(item.penalty)}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            
                                                            {isActive && !item.isRent && (
                                                                <button 
                                                                    onClick={() => {
                                                                        const isVirtual = item.id?.toString().startsWith('v-');
                                                                        handleStartPayment(
                                                                            item.total, 
                                                                            selectedKost.kostId, 
                                                                            'tagihan_ekstra', 
                                                                            { 
                                                                                billId: item.id, 
                                                                                name: item.bill_name,
                                                                                billPayment: true,
                                                                                pendingBills: [item]
                                                                            }, 
                                                                            isVirtual ? undefined : item.id
                                                                        );
                                                                    }}
                                                                    className="w-full mt-4 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all shadow-lg shadow-emerald-200 active:scale-95"
                                                                >
                                                                    Bayar Sekarang
                                                                </button>
                                                            )}
                                                            {isActive && item.isRent && (
                                                                <button 
                                                                    onClick={() => handleOpenExtension(selectedKost)}
                                                                    className="w-full mt-4 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all shadow-lg shadow-orange-200 active:scale-95"
                                                                >
                                                                    Perpanjang Sewa Sekarang
                                                                </button>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {activeTotal > 0 && (
                                                <div className="space-y-4 mt-6">
                                                    <div className="bg-gray-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
                                                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-orange-500/20 transition-all duration-700" />
                                                        
                                                        <div className="flex justify-between items-center relative z-10">
                                                            <div>
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                                                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Total Tagihan Aktif</p>
                                                                </div>
                                                                <p className="text-3xl font-black text-white tracking-tighter">
                                                                    {FORMAT_CURRENCY(activeTotal)}
                                                                </p>
                                                                <p className="text-[8px] font-bold text-gray-500 mt-2 uppercase tracking-widest leading-relaxed">
                                                                    *Sudah termasuk denda keterlambatan (jika ada).
                                                                </p>
                                                            </div>
                                                            <div className="bg-white/10 px-6 py-3 rounded-2xl border border-white/10 backdrop-blur-sm">
                                                                <p className="text-[10px] font-black uppercase tracking-widest text-orange-400">Tagihan Aktif</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <button 
                                                        onClick={() => {
                                                            const activeBills = allItems.filter(item => item.displayType === 'active');
                                                            handleStartPayment(
                                                                activeTotal,
                                                                selectedKost.kostId,
                                                                'tagihan_ekstra',
                                                                {
                                                                    billPayment: true,
                                                                    billName: `Batch: ${activeBills.length} Tagihan (${selectedKost.kostName})`,
                                                                    pendingBills: activeBills,
                                                                    kostName: selectedKost.kostName
                                                                }
                                                            );
                                                        }}
                                                        className="w-full bg-orange-600 hover:bg-orange-700 text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-orange-200 transition-all active:scale-95 flex items-center justify-center gap-3"
                                                    >
                                                        <Receipt className="w-5 h-5" /> BAYAR SEMUA TAGIHAN AKTIF
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}
                            </div>

                            <div className="mt-10 flex gap-4">
                                <button type="button" onClick={() => setShowExtraBillModal(false)} className="w-full py-4 text-gray-500 font-black uppercase text-[11px] tracking-widest hover:bg-gray-50 rounded-2xl transition-colors border border-gray-100">Tutup</button>
                            </div>
                        </div>
                        
                        <div className="bg-gray-50 p-4 border-t border-gray-100 flex items-center justify-center gap-2">
                             <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                             <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Secure Checkout Powered by Pakasir</span>
                        </div>
                    </div>
                </div>
            )}

            {/* 3. Modal Komplain */}
            {showComplaintModal && selectedKost && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white rounded-3xl w-full max-w-lg my-auto relative shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
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

                        <form onSubmit={submitComplaint} className="p-6 space-y-5">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Judul Kendala</label>
                                <input type="text" required value={complaintTitle} onChange={(e) => setComplaintTitle(e.target.value)} placeholder="Contoh: AC Kamar Bocor" className="w-full mt-1.5 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Detail Masalah</label>
                                <textarea rows={4} required value={complaintDesc} onChange={(e) => setComplaintDesc(e.target.value)} placeholder="Jelaskan secara rinci kerusakan atau masalah yang Anda alami..." className="w-full mt-1.5 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none resize-none"></textarea>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Lampiran Foto (Opsional)</label>
                                <label className="mt-1.5 flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 hover:border-red-500 transition-colors">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <p className="text-sm font-bold text-gray-600">
                                            {complaintPhoto ? complaintPhoto.name : "Unggah Foto Bukti Kendala"}
                                        </p>
                                    </div>
                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => setComplaintPhoto(e.target.files?.[0] || null)} />
                                </label>
                            </div>

                            <div className="mt-6 pt-6 border-t border-gray-100 flex gap-3">
                                <button type="button" onClick={() => setShowComplaintModal(false)} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-50 rounded-xl border border-transparent">Batal</button>
                                <button type="submit" disabled={isSubmitting} className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg disabled:opacity-50 transition-colors">
                                    {isSubmitting ? 'Mengirim...' : 'Kirim Komplain'}
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
                    existingOrderId={(paymentOrderId && !paymentOrderId.startsWith('v-')) ? paymentOrderId : undefined}
                    metadata={{
                        ...paymentMetadata,
                        userName: user.name || user.displayName || 'Penyewa',
                        userEmail: user.email,
                        timestamp: new Date().toISOString(),
                        productName: selectedKost?.kostName
                    }}
                    onPaymentSuccess={async () => {
                        const meta = paymentMetadata as any;
                        if (meta?.billPayment && meta?.pendingBills) {
                            const pendingIds = meta.pendingBills.map((b: any) => b.id);
                            await settlePendingBills(pendingIds);
                        }
                        setShowPaymentGateway(false);
                        alert('Pembayaran Berhasil!');
                        fetchMyKosts(); // Refresh data
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
                            <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm mb-8">
                                <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-emerald-500" /> Summary Penilaian Unit Kost
                                </h4>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {[
                                        { id: 'room_facilities', label: 'Fasilitas Kamar', icon: '🛏️', color: 'bg-blue-50 text-blue-600' },
                                        { id: 'bathroom_facilities', label: 'Fasilitas WC', icon: '🚿', color: 'bg-emerald-50 text-emerald-600' },
                                        { id: 'water_check', label: 'Pengecekan Air', icon: '💧', color: 'bg-cyan-50 text-cyan-600' },
                                        { id: 'wifi_check', label: 'Pengecekan WiFi', icon: '📶', color: 'bg-indigo-50 text-indigo-600' },
                                        { id: 'security_check', label: 'Pengecekan Keamanan', icon: '🛡️', color: 'bg-purple-50 text-purple-600' },
                                        { id: 'access_check', label: 'Akses Umum/Toko', icon: '📍', color: 'bg-orange-50 text-orange-600' },
                                    ].map((item) => (
                                        <div key={item.id} className="space-y-4">
                                            <div className="flex items-center gap-2">
                                                <span className={`p-1.5 rounded-lg text-xs ${item.color.split(' ')[0]}`}>{item.icon}</span>
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.label}</span>
                                            </div>
                                            <div className="bg-gray-50 p-5 rounded-[2rem] border border-gray-100/50">
                                                <p className="text-sm font-bold text-gray-800 mb-4 leading-relaxed">
                                                    {selectedSurvey.evaluation_summary?.[item.id] || 'Tidak ada catatan surveyor untuk poin ini.'}
                                                </p>
                                                
                                                {/* Space for photos */}
                                                <div className="space-y-2">
                                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                                        ⚡ Bukti Foto Lapangan
                                                    </p>
                                                    <div className="grid grid-cols-3 gap-3">
                                                        {selectedSurvey.evaluation_summary?.[`${item.id}_photos`]?.length > 0 ? (
                                                            selectedSurvey.evaluation_summary[`${item.id}_photos`].map((url: string, idx: number) => (
                                                                <div 
                                                                    key={idx} 
                                                                    className="relative aspect-square rounded-2xl overflow-hidden border border-gray-200 cursor-pointer hover:scale-[1.03] active:scale-95 transition-all shadow-sm group"
                                                                    onClick={() => window.open(url, '_blank')}
                                                                >
                                                                    <img src={url} alt={`${item.label} proof`} className="w-full h-full object-cover" />
                                                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                                                                    </div>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className="col-span-3 h-20 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center bg-white/50">
                                                                <p className="text-[10px] font-bold text-gray-400 italic">Tidak ada lampiran foto</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    
                                    <div className="md:col-span-2 space-y-2 pt-4 border-t border-gray-100">
                                        <div className="flex items-center gap-2">
                                            <span className="p-1.5 rounded-lg text-xs bg-pink-50">💬</span>
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Wawancara Testimoni Penghuni</span>
                                        </div>
                                        <div className="relative">
                                            <div className="absolute top-0 left-0 text-4xl text-gray-100 font-serif">"</div>
                                            <p className="text-sm font-medium text-gray-600 italic bg-gray-50 p-4 rounded-xl border border-gray-100/50 relative z-10 pl-8">
                                                {selectedSurvey.evaluation_summary?.resident_testimonial || 'Belum ada testimoni penghuni yang tercatat.'}
                                            </p>
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
        </div>
    );
};

export default MyKost;
