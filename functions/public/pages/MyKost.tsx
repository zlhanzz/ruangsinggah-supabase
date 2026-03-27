import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { ArrowLeft, Clock, MapPin, Receipt, Upload, Plus, MessageSquare, AlertCircle, FileText, X, Star, CheckCircle, Smartphone, Calendar, Search, Heart, ChevronRight, Zap, XCircle } from 'lucide-react';
import { Page } from '../types';
import { addPropertyReview, getExtraBills } from '../userService';
import { getOrCreateChatSession } from '../chatService';
import { getReviews } from '../costService';
import { cancelBookingRequest } from '../userService';
import PaymentGateway from '../components/PaymentGateway';
import ChatWindow from '../components/ChatWindow';

interface MyKostProps {
    user: any;
    onPageChange: (page: Page) => void;
}

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
                const ownerId = 'admin-system-id'; // Tetap fallback admin, tapi akan gagal di DB jika bukan UUID
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

    const handleOpenPayment = (kost: any) => {
        setSelectedKost(kost);
        setPaymentAmount(kost.totalPrice || kost.amount || 0);
        setPaymentOrderId(kost.id);
        setPaymentProductId(kost.kostId);
        setPaymentProductType('kost_booking');
        setPaymentMetadata({
            kostName: kost.kostName,
            roomType: kost.roomType,
            duration: kost.duration,
            period: kost.period,
            startDate: kost.moveInDate,
            endDate: kost.endDate
        });
        setShowPaymentGateway(true);
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

            // Batch fetch unique properties since join might fail due to FK issues
            const productIds = Array.from(new Set(data?.map(d => d.product_id || d.kost_id).filter(id => !!id)));
            const { data: propertiesData } = await supabase
                .from('properties')
                .select('id, title, image_urls, owner_uid, city, area')
                .in('id', productIds);
            
            const propMap = (propertiesData || []).reduce((acc: any, p: any) => {
                acc[p.id] = p;
                return acc;
            }, {});
            
            const kostsData: any[] = [];
            data?.forEach((doc) => {
                const isRent = doc.product_type === 'rent' || doc.type === 'sewa_kost' || doc.product_type === 'kost_booking' || !doc.product_type || doc.category === 'kost';
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
                        const end = new Date(metadata.endDate);
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
                const kostId = curr.kostId;
                if (!acc[kostId]) {
                    acc[kostId] = curr;
                } else {
                    const existingStatus = (acc[kostId].status || '').toLowerCase();
                    const currentStatus = (curr.status || '').toLowerCase();
                    
                    const pExisting = statusPriority[existingStatus] || 0;
                    const pCurrent = statusPriority[currentStatus] || 0;

                    if (pCurrent > pExisting) {
                        acc[kostId] = curr;
                    } else if (pCurrent === pExisting) {
                        // If priority is same, take the latest one
                        const tExisting = new Date(acc[kostId].created_at || 0).getTime();
                        const tCurrent = new Date(curr.created_at || 0).getTime();
                        if (tCurrent > tExisting) {
                            acc[kostId] = curr;
                        }
                    }
                }
                return acc;
            }, {}));

            // Fetch extra bills
            const bills = await getExtraBills(user.uid);

            // Associate extra bills with real kosts
            const activeWithBills = uniqueKosts.map(k => {
                const pendBills = (bills || []).filter(b => (b.product_id === k.kostId || b.kost_id === k.kostId) && b.status === 'pending');
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
            // Fetch surveys
            const { data: surveysData, error: surveysError } = await supabase
                .from('survey_requests')
                .select('*')
                .eq('user_id', user.uid);
            
            if (surveysError) {
                console.error('fetchSurveys error:', surveysError);
            } else {
                // DUMMY DATA FOR UI REVIEW
                const dummySurveys = [
                    {
                        id: 'dummy-1',
                        status: 'AWAITING_PAYMENT',
                        kost_name: 'Kost Orange Suite',
                        kost_address: 'Jl. Melati No. 12, Jakarta',
                        owner_phone: '0812-3456-7890',
                        survey_date: '2026-03-30',
                        survey_time: '14:00',
                        created_at: new Date().toISOString()
                    },
                    {
                        id: 'dummy-2',
                        status: 'PENDING_ASSIGNMENT',
                        kost_name: 'Kost Blue Resident',
                        kost_address: 'Jl. Mawar No. 5, Bandung',
                        owner_phone: '0856-7890-1234',
                        survey_date: '2026-03-31',
                        survey_time: '10:00',
                        created_at: new Date().toISOString()
                    },
                    {
                        id: 'dummy-3',
                        status: 'AGENT_ASSIGNED',
                        kost_name: 'Kost Purple Garden',
                        kost_address: 'Jl. Anggrek No. 22, Surabaya',
                        owner_phone: '0821-2222-3333',
                        survey_date: '2026-04-01',
                        survey_time: '13:00',
                        agent_name: 'Budi Surveyor',
                        agent_phone: '628123456789',
                        created_at: new Date().toISOString()
                    },
                    {
                        id: 'dummy-4',
                        status: 'SURVEYING',
                        kost_name: 'Kost Emerald Park',
                        kost_address: 'Jl. Tulip No. 8, Medan',
                        owner_phone: '0819-8888-9999',
                        survey_date: '2026-04-02',
                        survey_time: '11:00',
                        agent_name: 'Siti Surveyor',
                        agent_phone: '628987654321',
                        created_at: new Date().toISOString()
                    },
                    {
                        id: 'dummy-5',
                        status: 'COMPLETED',
                        kost_name: 'Kost Black Diamond',
                        kost_address: 'Jl. Kamboja No. 15, Makassar',
                        owner_phone: '0811-0000-1111',
                        survey_date: '2026-04-03',
                        survey_time: '16:00',
                        result_drive_link: 'https://drive.google.com/drive/folders/dummy',
                        created_at: new Date().toISOString()
                    }
                ];
                setSurveyRequests([...dummySurveys, ...(surveysData || [])]);
            }

            setRecommendations(processedRecs);
            setExtraBills(bills || []);
        } catch (error) {
            console.error('Error fetching my kosts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStartPayment = (amount: number, prodId: string, prodType: any, metadata: any) => {
        setPaymentAmount(amount);
        setPaymentProductId(prodId);
        setPaymentProductType(prodType);
        setPaymentMetadata(metadata);
        setPaymentOrderId(`${prodType.toUpperCase()}-${Date.now()}`);
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
                kost_id: selectedKost.kostId,
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
                kost_id: selectedKost.kostId,
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

    const filteredKosts = activeKosts.filter(kost => {
        const isPaid = ['paid', 'approved', 'selesai', 'success', 'berhasil'].includes((kost.status || '').toLowerCase());
        const isPastStay = kost.daysRemaining !== null && kost.daysRemaining < 0;
        
        if (activeTab === 'diajukan') return ['pending_approval', 'awaiting_payment'].includes((kost.status || '').toLowerCase());
        if (activeTab === 'aktif') return isPaid && !isPastStay;
        if (activeTab === 'riwayat') return isPastStay || ['rejected', 'cancelled'].includes((kost.status || '').toLowerCase());
        return false;
    });

    const filteredSurveys = surveyRequests.filter(survey => {
        const status = survey.status;
        // Logic: Surveys can appear in multiple tabs as "history" (minimized)
        if (activeTab === 'diajukan') return true; // Show all in Diajukan
        if (activeTab === 'aktif') return ['AGENT_ASSIGNED', 'SURVEYING', 'COMPLETED'].includes(status);
        if (activeTab === 'riwayat') return ['COMPLETED', 'CANCELLED'].includes(status);
        return false;
    });

    const renderSurveyCard = (survey: any, compact: boolean = false) => {
        const status = survey.status;
        const statusColors: any = {
            'AWAITING_PAYMENT': 'bg-orange-50 text-orange-600 border-orange-100',
            'PENDING_ASSIGNMENT': 'bg-blue-50 text-blue-600 border-blue-100',
            'AGENT_ASSIGNED': 'bg-purple-50 text-purple-600 border-purple-100',
            'SURVEYING': 'bg-emerald-50 text-emerald-600 border-emerald-100',
            'COMPLETED': 'bg-gray-900 text-white border-transparent',
            'CANCELLED': 'bg-gray-100 text-gray-400 border-gray-200'
        };

        const statusLabels: any = {
            'AWAITING_PAYMENT': 'Menunggu Pembayaran',
            'PENDING_ASSIGNMENT': 'Mencari Agen Surveyor',
            'AGENT_ASSIGNED': 'Agen Surveyor Ditetapkan',
            'SURVEYING': 'Sedang Proses Survey',
            'COMPLETED': 'Survey Selesai',
            'CANCELLED': 'Survey Dibatalkan'
        };

        const currentStatusColor = statusColors[status] || 'bg-gray-50 text-gray-500 border-gray-100';
        const currentLabel = statusLabels[status] || status;

        if (compact) {
            return (
                <div key={survey.id} className="group flex items-center gap-4 sm:gap-6 bg-white/40 backdrop-blur-md rounded-[2.5rem] p-4 sm:p-5 border border-white shadow-lg hover:shadow-xl transition-all duration-300">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-50 shrink-0 transform group-hover:rotate-3 transition-transform">
                        <Search className="w-8 h-8 text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-0.5">Layanan Jasa Survey</p>
                        <h4 className="text-lg sm:text-xl font-black text-gray-800 truncate">{survey.kost_name || 'Survey Lokasi Kost'}</h4>
                        <div className="flex items-center gap-2 mt-1">
                            <div className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${currentStatusColor}`}>
                                {currentLabel}
                            </div>
                            {survey.agent_name && (
                                <span className="text-[10px] font-bold text-gray-400 italic">• Surveyor: {survey.agent_name}</span>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 pr-2">
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
                                className="bg-orange-500 hover:bg-orange-600 text-white p-3 rounded-xl shadow-lg shadow-orange-100 active:scale-90 transition-all flex items-center gap-2"
                                title="Bayar Sekarang"
                            >
                                <Receipt className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase">Bayar</span>
                            </button>
                        ) : survey.agent_phone ? (
                            <button
                                onClick={() => window.open(`https://wa.me/${survey.agent_phone.replace(/\D/g, '')}`, '_blank')}
                                className="bg-emerald-500 hover:bg-emerald-600 text-white p-3 rounded-xl shadow-lg shadow-emerald-100 active:scale-90 transition-all"
                                title="Hubungi Surveyor"
                            >
                                <Smartphone className="w-4 h-4" />
                            </button>
                        ) : (
                            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100">
                                <Zap className="w-4 h-4 text-gray-300 animate-pulse" />
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        return (
            <div key={survey.id} className="group relative bg-white/70 backdrop-blur-2xl rounded-[3.5rem] p-8 sm:p-12 border border-white shadow-2xl shadow-gray-200/50 flex flex-col lg:flex-row gap-10 lg:gap-14 hover:scale-[1.01] transition-all duration-500 overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-400/10 to-transparent rounded-full blur-3xl -mr-32 -mt-32 group-hover:from-blue-400/20 transition-all duration-700" />
                
                <div className="flex-1 relative z-10">
                    <div className="flex items-start gap-8 mb-8">
                        <div className="relative">
                            <div className="w-24 h-24 sm:w-28 sm:h-28 bg-white rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-blue-200 border-4 border-white transform rotate-3 group-hover:rotate-0 transition-all duration-500">
                                <Search className="w-12 h-12 text-blue-500" />
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-2xl shadow-lg flex items-center justify-center border-2 border-blue-50">
                                <Zap className="w-5 h-5 text-blue-500 fill-blue-500" />
                            </div>
                        </div>

                        <div className="flex-1">
                            <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-2">Layanan Jasa Survey</h4>
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
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-50 rounded-lg"><Calendar className="w-4 h-4 text-blue-500" /></div>
                                        <span className="text-gray-600 font-bold italic bg-blue-50/50 px-3 py-1 rounded-xl border border-blue-100/50">
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

                    {survey.agent_name && (
                        <div className="mt-8 bg-white/50 backdrop-blur-sm p-6 rounded-[2rem] border border-gray-100 flex items-center gap-4">
                            <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-xl font-black text-gray-400">
                                {survey.agent_name.charAt(0)}
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Surveyor Anda</p>
                                <p className="text-base font-black text-gray-900">{survey.agent_name}</p>
                                <p className="text-xs font-bold text-emerald-600">{survey.agent_phone || 'Nomor tersedia'}</p>
                            </div>
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
                    ) : status === 'COMPLETED' && survey.result_drive_link ? (
                        <button
                            onClick={() => window.open(survey.result_drive_link, '_blank')}
                            className="bg-gray-900 hover:bg-emerald-600 text-white px-8 py-6 rounded-[2rem] font-black flex items-center justify-center gap-3 transition-all text-sm shadow-2xl shadow-gray-300 active:scale-95 group/drive"
                        >
                            <FileText className="w-6 h-6 group-hover/drive:-translate-y-1 transition-transform" /> LIHAT HASIL SURVEY
                        </button>
                    ) : (
                        <div className="p-8 text-center bg-gray-50 rounded-[2.5rem] border border-dashed border-gray-200">
                            <Zap className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-relaxed">
                                {status === 'PENDING_ASSIGNMENT' ? 'Pesanan Sedang Diproses Admin' : 
                                 status === 'AGENT_ASSIGNED' ? 'Surveyor Sedang Menuju Lokasi' :
                                 status === 'SURVEYING' ? 'Surveyor Sedang Mengambil Foto & Video' :
                                 'Mohon Tunggu Sebentar'}
                            </p>
                        </div>
                    )}

                    {survey.agent_phone && (
                        <button
                            onClick={() => window.open(`https://wa.me/${survey.agent_phone.replace(/\D/g, '')}`, '_blank')}
                            className="w-full bg-emerald-50 text-emerald-600 border-2 border-emerald-100 hover:bg-emerald-100 px-4 py-4 rounded-2xl font-black flex items-center justify-center gap-3 transition-all text-[11px]"
                        >
                            <Smartphone className="w-4 h-4" /> HUBUNGI SURVEYOR
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

    return (
        <div className="min-h-screen bg-[#F8FAFC] pt-20 pb-12 font-outfitSelection">
            {/* Background Decorations */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-orange-100/30 rounded-full blur-[120px]" />
                <div className="absolute top-[20%] -left-[10%] w-[30%] h-[30%] bg-blue-100/20 rounded-full blur-[100px]" />
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

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
                            <Zap className="w-4 h-4 text-orange-500 fill-orange-500" /> 
                            Kelola hunian aktif Anda dengan mudah
                        </p>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="bg-gray-100/50 p-1.5 rounded-[2rem] flex items-center gap-1 self-start md:self-auto border border-gray-100/80 backdrop-blur-sm">                        {[
                            { id: 'diajukan', label: 'Diajukan', count: activeKosts.filter(k => {
                                const s = (k.status || '').toLowerCase();
                                return ['pending_approval', 'awaiting_payment'].includes(s);
                            }).length + surveyRequests.length },
                            { id: 'aktif', label: 'Aktif', count: activeKosts.filter(k => {
                                const s = (k.status || '').toLowerCase();
                                const isPaid = ['approved', 'paid', 'selesai', 'success', 'berhasil'].includes(s);
                                return isPaid && (!k.endDate || new Date() <= new Date(k.endDate));
                            }).length + surveyRequests.filter(s => ['AGENT_ASSIGNED', 'SURVEYING', 'COMPLETED'].includes(s.status)).length },
                            { id: 'riwayat', label: 'Riwayat', count: activeKosts.filter(k => {
                                const s = (k.status || '').toLowerCase();
                                const isPaid = ['approved', 'paid', 'selesai', 'success', 'berhasil'].includes(s);
                                return isPaid && k.endDate && new Date() > new Date(k.endDate);
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
                                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(bill.amount || 0)}
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
                        {filteredSurveys.map(survey => {
                            let isCompact = true;
                            const s = survey.status;
                            if (activeTab === 'diajukan' && ['AWAITING_PAYMENT', 'PENDING_ASSIGNMENT'].includes(s)) isCompact = false;
                            if (activeTab === 'aktif' && ['AGENT_ASSIGNED', 'SURVEYING'].includes(s)) isCompact = false;
                            if (activeTab === 'riwayat' && s === 'COMPLETED') isCompact = false;
                            return renderSurveyCard(survey, isCompact);
                        })}
                        
                        {filteredKosts.map((kost) => {
                            const statusLower = (kost.status || '').toLowerCase();
                            const isPaid = ['approved', 'paid', 'selesai', 'success', 'berhasil'].includes(statusLower);
                            const isCompact = ['cancelled', 'rejected'].includes(statusLower) || (activeTab === 'diajukan' && isPaid);
                            
                            if (isCompact) {
                                return (
                                    <div key={kost.id} className="group flex items-center gap-4 sm:gap-6 bg-white/40 backdrop-blur-md rounded-[2rem] p-4 sm:p-5 border border-white shadow-lg hover:shadow-xl transition-all duration-300">
                                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-white shadow-sm shrink-0">
                                            {kost.displayImage ? (
                                                <img src={kost.displayImage} className="w-full h-full object-cover opacity-60 grayscale-[50%]" alt={kost.kostName} />
                                            ) : (
                                                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                                    <MapPin className="w-6 h-6 text-gray-300" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-lg sm:text-xl font-black text-gray-500 truncate">{kost.kostName || 'Kost Tersembunyi'}</h4>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{kost.roomType || 'Standard Room'}</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-2 pr-2">
                                            {statusLower === 'cancelled' ? (
                                                <span className="flex items-center gap-1.5 text-gray-400 bg-gray-50 px-4 py-2 rounded-xl text-[10px] font-black uppercase border border-gray-100 italic">
                                                    <XCircle className="w-3.5 h-3.5" /> DIBATALKAN
                                                </span>
                                            ) : statusLower === 'rejected' ? (
                                                <span className="flex items-center gap-1.5 text-red-400 bg-red-50/50 px-4 py-2 rounded-xl text-[10px] font-black uppercase border border-red-100 italic">
                                                    <XCircle className="w-3.5 h-3.5" /> DITOLAK
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1.5 text-emerald-500 bg-emerald-50 px-4 py-2 rounded-xl text-[10px] font-black uppercase border border-emerald-100 italic">
                                                    <CheckCircle className="w-3.5 h-3.5" /> LUNAS
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <div key={kost.id} className="group relative bg-white/70 backdrop-blur-2xl rounded-[3.5rem] p-8 sm:p-12 border border-white shadow-2xl shadow-gray-200/50 flex flex-col lg:flex-row gap-10 lg:gap-14 hover:scale-[1.01] transition-all duration-500 overflow-hidden">
                                {/* Animated Background Glow */}
                                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-orange-400/10 to-transparent rounded-full blur-3xl -mr-32 -mt-32 group-hover:from-orange-400/20 transition-all duration-700" />
                                
                                {/* Visual / Info Left */}
                                <div className="flex-1 relative z-10">
                                    <div className="flex items-start gap-8 mb-10">
                                        <div className="relative">
                                            <div className="w-24 h-24 sm:w-28 sm:h-28 bg-white rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-orange-200 border-4 border-white transform -rotate-3 group-hover:rotate-0 transition-all duration-500 overflow-hidden">
                                                {kost.displayImage ? (
                                                    <img src={kost.displayImage} className="w-full h-full object-cover" alt={kost.kostName} />
                                                ) : (
                                                    <MapPin className="w-12 h-12 text-orange-500" />
                                                )}
                                            </div>
                                            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-2xl shadow-lg flex items-center justify-center border-2 border-orange-50">
                                                <Zap className="w-5 h-5 text-orange-500 fill-orange-500" />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex-1">
                                                <div className="flex flex-col gap-2">
                                                    <button 
                                                        onClick={() => onPageChange(`${Page.DETAIL}?kostId=${kost.kostId}` as any)}
                                                        className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight tracking-tight text-left hover:text-orange-500 transition-colors group/title flex items-center gap-3"
                                                    >
                                                        {kost.kostName || 'Kost Tersembunyi'}
                                                        <ChevronRight className="w-8 h-8 opacity-0 -translate-x-4 group-hover/title:opacity-100 group-hover/title:translate-x-0 transition-all text-orange-500" />
                                                    </button>
                                                    {/* Quick Rating Stars */}
                                                    {['approved', 'paid', 'Selesai', 'success', 'Berhasil'].includes(kost.status) && (
                                                        <div className="flex items-center gap-1.5 bg-white/50 backdrop-blur-sm self-start px-3 py-1.5 rounded-xl border border-gray-100 shadow-sm">
                                                            {[1, 2, 3, 4, 5].map((s) => (
                                                                <button
                                                                    key={s}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setRatingValue(s);
                                                                        setRatingComment('');
                                                                        setSelectedKost(kost);
                                                                        setShowRatingModal(true);
                                                                    }}
                                                                    className="transition-all hover:scale-125 hover:-translate-y-0.5"
                                                                >
                                                                    <Star className={`w-4 h-4 ${s <= 0 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 hover:text-yellow-400'}`} />
                                                                </button>
                                                            ))}
                                                            <span className="text-[10px] font-black text-gray-400 ml-2 uppercase tracking-widest">Beri Rating</span>
                                                        </div>
                                                    )}
                                                </div>
                                                {kost.daysRemaining !== null && ['approved', 'paid', 'Selesai', 'success', 'Berhasil'].includes(kost.status) && (
                                                    <div className={`group/badge relative px-6 py-3.5 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.15em] flex items-center gap-3 shadow-2xl border transition-all duration-500 self-start ${
                                                        kost.daysRemaining <= 7 
                                                        ? 'bg-red-600 text-white border-red-500 shadow-red-200 z-20' 
                                                        : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                    }`}>
                                                        <div className={`w-3 h-3 rounded-full flex items-center justify-center ${kost.daysRemaining <= 7 ? 'bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)]' : 'bg-emerald-500'}`}>
                                                            {kost.daysRemaining <= 7 && <div className="w-full h-full bg-white rounded-full animate-ping opacity-75" />}
                                                        </div>
                                                        <span className="relative">
                                                            {kost.daysRemaining < 0 ? 'Masa Sewa Habis' : `${kost.daysRemaining} Hari Tersisa`}
                                                        </span>
                                                        {kost.daysRemaining <= 7 && (
                                                             <Zap className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300 animate-bounce" />
                                                        )}
                                                    </div>
                                                )}
                                            <div className="flex flex-wrap items-center gap-3 mt-6">
                                                <span className="bg-gray-100/80 backdrop-blur-sm px-5 py-2.5 rounded-2xl text-[11px] font-black text-gray-700 uppercase tracking-wider">
                                                    {kost.roomType || 'Standard Room'}
                                                </span>
                                                {statusLower === 'pending_approval' && (
                                                    <span className="flex items-center gap-2.5 text-orange-600 bg-orange-50/80 backdrop-blur-sm px-5 py-2.5 rounded-2xl border border-orange-100 text-[11px] font-black uppercase tracking-wider">
                                                        <Clock className="w-4 h-4" /> MENUNGGU PERSETUJUAN
                                                    </span>
                                                )}
                                                {statusLower === 'awaiting_payment' && (
                                                    <span className="flex items-center gap-2.5 text-blue-600 bg-blue-50/80 backdrop-blur-sm px-5 py-2.5 rounded-2xl border border-blue-100 text-[11px] font-black uppercase tracking-wider">
                                                        <Zap className="w-4 h-4 fill-blue-600" /> DISETUJUI, SILAKAN BAYAR
                                                    </span>
                                                )}
                                                {statusLower === 'rejected' && (
                                                    <span className="flex items-center gap-2.5 text-red-600 bg-red-50/80 backdrop-blur-sm px-5 py-2.5 rounded-2xl border border-red-100 text-[11px] font-black uppercase tracking-wider">
                                                        <XCircle className="w-4 h-4" /> PENGAJUAN DITOLAK
                                                    </span>
                                                )}
                                                {isPaid && (
                                                    <span className="flex items-center gap-2.5 text-emerald-600 bg-emerald-50/80 backdrop-blur-sm px-5 py-2.5 rounded-2xl border border-emerald-100 text-[11px] font-black uppercase tracking-wider">
                                                        <CheckCircle className="w-4 h-4" /> SEDANG DISEWA
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stats Grid - Only show if approved/paid */}
                                    {['approved', 'paid', 'Selesai', 'success', 'Berhasil', 'AWAITING_PAYMENT'].includes(kost.status) && (
                                        <div className="bg-[#FBFCFE]/80 backdrop-blur-sm rounded-[2.5rem] p-6 sm:p-10 border border-gray-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 hover:border-orange-200 group-hover:bg-white transition-all duration-500">
                                            <div className="flex items-center gap-4 lg:flex-col lg:items-start lg:gap-2">
                                                <div className="p-3 bg-orange-100 rounded-2xl"><Clock className="w-5 h-5 text-orange-600" /></div>
                                                <div>
                                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Durasi</p>
                                                    <p className="text-base sm:text-lg font-black text-gray-900">{kost.duration || 1} {kost.period || 'Bulan'}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4 lg:flex-col lg:items-start lg:gap-2">
                                                <div className="p-3 bg-blue-100 rounded-2xl"><FileText className="w-5 h-5 text-blue-600" /></div>
                                                <div>
                                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Mulai</p>
                                                    <p className="text-base sm:text-lg font-black text-gray-900">
                                                        {kost.moveInDate ? new Date(kost.moveInDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4 lg:flex-col lg:items-start lg:gap-2">
                                                <div className="p-3 bg-rose-100 rounded-2xl"><Calendar className="w-5 h-5 text-rose-600" /></div>
                                                <div>
                                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Selesai</p>
                                                    <p className="text-base sm:text-lg font-black text-gray-900">
                                                        {kost.endDate ? new Date(kost.endDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4 lg:flex-col lg:items-start lg:gap-2">
                                                <div className="p-3 bg-emerald-100 rounded-2xl"><Receipt className="w-5 h-5 text-emerald-600" /></div>
                                                <div>
                                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Tagihan</p>
                                                    <p className="text-base sm:text-lg font-black text-emerald-600">
                                                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(kost.totalPrice || 0)}
                                                    </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Actions Column */}
                                 <div className="flex flex-col gap-6 lg:w-80 shrink-0 justify-start relative z-10 pt-4">
                                    <div className="grid grid-cols-1 gap-6">
                                        <button
                                            onClick={() => {
                                                const query = `${kost.kostName} ${kost.location || ''} ${kost.city || ''}`.trim();
                                                window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, '_blank');
                                            }}
                                            className="bg-gray-900 hover:bg-emerald-600 text-white px-8 py-5 rounded-[1.5rem] font-black flex items-center justify-center gap-3 transition-all text-[13px] shadow-2xl shadow-gray-300 active:scale-95 group/loc"
                                        >
                                            <MapPin className="w-5 h-5 group-hover/loc:-translate-y-0.5 transition-transform" /> LIHAT LOKASI KOST
                                        </button>

                                         {kost.status === 'AWAITING_PAYMENT' && (
                                            <button
                                                onClick={() => handleOpenPayment(kost)}
                                                className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-7 rounded-[2.2rem] font-black flex flex-col items-center justify-center gap-1 transition-all text-[15px] shadow-2xl shadow-orange-200 active:scale-95 animate-subtle-bounce relative"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Receipt className="w-6 h-6" /> BAYAR SEWA SEKARANG
                                                </div>
                                                <span className="text-[10px] opacity-80 font-bold uppercase tracking-widest text-white">Klik untuk buka link pembayaran</span>
                                            </button>
                                        )}

                                        {['approved', 'paid', 'Selesai', 'success', 'Berhasil'].includes(kost.status) && (
                                            <>
                                                <button
                                                    onClick={() => handleOpenExtension(kost)}
                                                    className="group/btn bg-orange-500 hover:bg-orange-600 text-white px-8 py-5 rounded-[1.5rem] font-black flex items-center justify-center gap-3 transition-all text-[13px] shadow-2xl shadow-orange-200 active:scale-95"
                                                >
                                                    <Plus className="w-5 h-5 group-hover/btn:rotate-90 transition-transform" /> PERPANJANG SEWA
                                                </button>

                                                <button
                                                    onClick={() => handleOpenBill(kost)}
                                                    className="bg-gray-900 hover:bg-emerald-600 text-white px-8 py-5 rounded-[1.5rem] font-black flex items-center justify-center gap-3 transition-all text-[13px] shadow-2xl shadow-gray-300 active:scale-95 group/bill"
                                                >
                                                    <Receipt className="w-5 h-5 group-hover/bill:-translate-y-0.5 transition-transform" /> LIHAT TAGIHAN
                                                </button>
                                            </>
                                        )}

                                        <button
                                            onClick={() => handleOpenChat(kost)}
                                            className="bg-white border-2 border-gray-100 hover:border-emerald-500 hover:text-emerald-600 text-gray-700 px-4 py-4 rounded-2xl font-black flex items-center justify-center gap-2.5 transition-all text-[11px] group/item"
                                        >
                                            <Smartphone className="w-4 h-4 group-hover/item:-translate-y-0.5 transition-transform" /> HUBUNGI PEMILIK
                                        </button>
                                    </div>

                                    {['approved', 'paid', 'Selesai', 'success', 'Berhasil'].includes(kost.status) && (
                                        <button
                                            onClick={() => handleOpenComplaint(kost)}
                                            className="w-full bg-white border-2 border-gray-100 hover:border-red-500 hover:bg-red-50 hover:text-red-600 text-gray-500 px-4 py-4 rounded-2xl font-black flex items-center justify-center gap-3 transition-all text-[11px] mt-2 group/comp"
                                        >
                                            <MessageSquare className="w-4 h-4 group-hover/comp:-translate-y-0.5 transition-transform" /> AJUKAN KOMPLAIN
                                        </button>
                                    )}

                                    {activeTab === 'riwayat' && (
                                        <button
                                            onClick={() => onPageChange(`${Page.DETAIL}?kostId=${kost.kostId}` as any)}
                                            className="w-full bg-orange-500 hover:bg-orange-600 text-white px-4 py-4 rounded-2xl font-black flex items-center justify-center gap-3 transition-all text-[11px] mt-4 shadow-xl shadow-orange-100 active:scale-95"
                                        >
                                            <Search className="w-4 h-4" /> AJUKAN SEWA LAGI
                                        </button>
                                    )}

                                    {/* Cancellation Button for Pending/Awaiting States */}
                                    {(kost.status === 'PENDING_APPROVAL' || kost.status === 'AWAITING_PAYMENT') && (
                                        <button
                                            onClick={() => handleCancelBooking(kost)}
                                            className="w-full bg-white border-2 border-gray-100 hover:border-red-500 hover:bg-red-50 hover:text-red-600 text-gray-500 px-4 py-4 rounded-2xl font-black flex items-center justify-center gap-3 transition-all text-[11px] mt-4 group/cancel"
                                        >
                                            <XCircle className="w-4 h-4 group-hover/cancel:rotate-90 transition-transform" /> BATALKAN PENGAJUAN
                                        </button>
                                    )}

                                    {/* Cancelled Status Placeholder */}
                                    {kost.status === 'CANCELLED' && (
                                        <div className="w-full bg-gray-50 border-2 border-gray-100 text-gray-400 px-4 py-4 rounded-2xl font-black flex items-center justify-center gap-3 text-[11px] mt-4 opacity-75 cursor-not-allowed italic">
                                            <XCircle className="w-4 h-4" /> PENGAJUAN DIBATALKAN
                                        </div>
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
                                </div>

                                {/* Price Breakdown */}
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-2">Rincian Pembayaran</h4>
                                    <div className="bg-white border-2 border-dashed border-gray-100 rounded-[2rem] p-6 space-y-4">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-500 font-medium">Sewa Kost ({extensionPeriod} {selectedKost.period || 'Bulan'})</span>
                                            <span className="text-gray-900 font-black">
                                                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format((selectedKost.basePrice || selectedKost.totalPrice / (selectedKost.duration || 1)) * extensionPeriod)}
                                            </span>
                                        </div>
                                        
                                        {selectedKost.totalPendingBills > 0 && (
                                            <div className="flex justify-between items-center text-sm py-3 border-y border-gray-50">
                                                <div className="flex flex-col">
                                                    <span className="text-gray-500 font-medium">Tagihan Tambahan Tertunggak</span>
                                                    <span className="text-[10px] text-orange-500 font-black uppercase">Wajib Dilunasi</span>
                                                </div>
                                                <span className="text-gray-900 font-black">
                                                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(selectedKost.totalPendingBills)}
                                                </span>
                                            </div>
                                        )}

                                        <div className="flex justify-between items-center pt-2">
                                            <span className="text-gray-900 font-black uppercase tracking-widest text-xs">Total Bayar</span>
                                            <span className="text-2xl font-black text-orange-600">
                                                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(
                                                    ((selectedKost.basePrice || selectedKost.totalPrice / (selectedKost.duration || 1)) * extensionPeriod) + 
                                                    (selectedKost.totalPendingBills || 0)
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex gap-3 items-start">
                                    <Zap className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                                    <p className="text-[11px] text-blue-800 font-medium leading-relaxed">
                                        Pembayaran akan dikonfirmasi otomatis melalui sistem <b>Payment Gateway</b>. Anda dapat menggunakan QRIS atau Virtual Account.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-10 flex gap-4">
                                <button type="button" onClick={() => setShowExtensionModal(false)} className="flex-1 py-4 text-gray-500 font-black uppercase text-[11px] tracking-widest hover:bg-gray-50 rounded-2xl transition-colors">Batal</button>
                                <button 
                                    onClick={() => {
                                        const total = ((selectedKost.basePrice || selectedKost.totalPrice / (selectedKost.duration || 1)) * extensionPeriod) + (selectedKost.totalPendingBills || 0);
                                        handleStartPayment(total, selectedKost.kostId, 'kost_booking', {
                                            extensionPeriod,
                                            extensionType: 'manual_extension',
                                            includeBills: true,
                                            pendingBills: selectedKost.pendingBills
                                        });
                                    }}
                                    className="flex-[2] py-4 bg-gray-900 hover:bg-orange-600 text-white font-black uppercase text-[11px] tracking-[0.2em] rounded-2xl shadow-2xl shadow-gray-200 transition-all active:scale-95"
                                >
                                    Lanjut ke Pembayaran
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
                                
                                <div className="space-y-3">
                                    {(() => {
                                        const bills = [...(selectedKost.pendingBills || [])];
                                        // Auto-add rental extension bill if within 5 days
                                        if (selectedKost.daysRemaining <= 5) {
                                            const rentPrice = selectedKost.basePrice || (selectedKost.totalPrice / (selectedKost.duration || 1));
                                            bills.push({
                                                id: 'virtual-rent-ext',
                                                bill_name: `Perpanjang Sewa (${selectedKost.kostName})`,
                                                amount: rentPrice,
                                                isVirtual: true,
                                                created_at: new Date().toISOString()
                                            });
                                        }

                                        if (bills.length === 0) {
                                            return (
                                                <div className="text-center py-10 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100">
                                                    <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                                                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Semua Tagihan Lunas</p>
                                                </div>
                                            );
                                        }

                                        return bills.map((bill: any, idx: number) => (
                                            <div key={bill.id || idx} className={`flex justify-between items-center p-5 ${bill.isVirtual ? 'bg-orange-50 border-orange-100 shadow-sm' : 'bg-gray-50 border-transparent'} rounded-2xl hover:bg-white hover:shadow-xl hover:shadow-gray-100 border transition-all group relative overflow-hidden`}>
                                                {bill.isVirtual && (
                                                    <div className="absolute top-0 right-0 px-2 py-0.5 bg-orange-500 text-[8px] font-black text-white uppercase rounded-bl-lg">Jatuh Tempo</div>
                                                )}
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 ${bill.isVirtual ? 'bg-orange-100' : 'bg-white'} rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}>
                                                        <Receipt className={`w-5 h-5 ${bill.isVirtual ? 'text-orange-600' : 'text-gray-400 group-hover:text-blue-500'}`} />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-black text-gray-800">{bill.bill_name || 'Tagihan Tanpa Nama'}</p>
                                                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter mt-0.5">
                                                            {bill.isVirtual ? 'Masa Sewa Akan Berakhir' : `Tgl Tagihan: ${new Date(bill.created_at || Date.now()).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}`}
                                                        </p>
                                                    </div>
                                                </div>
                                                <p className={`text-sm font-black ${bill.isVirtual ? 'text-orange-600' : 'text-gray-900'} uppercase`}>
                                                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(bill.amount)}
                                                </p>
                                            </div>
                                        ));
                                    })()}
                                </div>

                                {/* Summary */}
                                {(() => {
                                    const rentPrice = selectedKost.daysRemaining <= 5 ? (selectedKost.basePrice || (selectedKost.totalPrice / (selectedKost.duration || 1))) : 0;
                                    const totalToPay = (selectedKost.totalPendingBills || 0) + rentPrice;

                                    if (totalToPay > 0) {
                                        return (
                                            <div className="mt-8 pt-8 border-t-2 border-dashed border-gray-100">
                                                <div className="flex justify-between items-end">
                                                    <div>
                                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Total yang Harus Dibayar</p>
                                                        <p className={`text-3xl font-black ${selectedKost.daysRemaining <= 5 ? 'text-orange-600' : 'text-blue-600'} tracking-tighter`}>
                                                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(totalToPay)}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className={`px-3 py-1 ${selectedKost.daysRemaining <= 5 ? 'bg-orange-100 text-orange-700' : 'bg-amber-100 text-amber-700'} rounded-lg text-[9px] font-black uppercase tracking-widest mb-2 inline-block`}>
                                                            {selectedKost.daysRemaining <= 5 ? 'Segera Bayar' : 'Menunggu Pembayaran'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                })()}
                            </div>

                            <div className="mt-10 flex gap-4">
                                <button type="button" onClick={() => setShowExtraBillModal(false)} className="flex-1 py-4 text-gray-500 font-black uppercase text-[11px] tracking-widest hover:bg-gray-50 rounded-2xl transition-colors">Tutup</button>
                                {(() => {
                                    const rentPrice = selectedKost.daysRemaining <= 5 ? (selectedKost.basePrice || (selectedKost.totalPrice / (selectedKost.duration || 1))) : 0;
                                    const totalToPay = (selectedKost.totalPendingBills || 0) + rentPrice;

                                    if (totalToPay > 0) {
                                        return (
                                            <button 
                                                onClick={() => handleStartPayment(totalToPay, selectedKost.kostId, 'kost_booking', {
                                                    billPayment: true,
                                                    isNearExpiry: selectedKost.daysRemaining <= 5,
                                                    kostId: selectedKost.kostId,
                                                    kostName: selectedKost.kostName,
                                                    pendingBills: selectedKost.pendingBills
                                                })}
                                                className={`flex-[2] py-4 ${selectedKost.daysRemaining <= 5 ? 'bg-orange-600 hover:bg-orange-700 shadow-orange-100' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-100'} text-white font-black uppercase text-[11px] tracking-[0.2em] rounded-2xl shadow-2xl transition-all active:scale-95`}
                                            >
                                                Bayar Sekarang
                                            </button>
                                        );
                                    }
                                    return null;
                                })()}
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
                    metadata={{
                        ...paymentMetadata,
                        userName: user.name || user.displayName || 'Penyewa',
                        userEmail: user.email,
                        timestamp: new Date().toISOString(),
                        productName: selectedKost?.kostName
                    }}
                    onPaymentSuccess={() => {
                        setShowPaymentGateway(false);
                        alert('Pembayaran Berhasil! Data sewa Anda sedang diperbarui.');
                        fetchMyKosts(); // Refresh data
                    }}
                    onCancel={() => setShowPaymentGateway(false)}
                />
            )}
        </div>
    );
};

export default MyKost;
