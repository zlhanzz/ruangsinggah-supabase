import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { ArrowLeft, Clock, MapPin, Receipt, Upload, Plus, MessageSquare, AlertCircle, FileText, X, Star, CheckCircle, Smartphone, Calendar, Search, Heart, ChevronRight, Zap } from 'lucide-react';
import { Page } from '../types';
import { addPropertyReview, getExtraBills } from '../userService';
import PaymentGateway from '../components/PaymentGateway';

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
    const [loading, setLoading] = useState(true);
    const [activeKosts, setActiveKosts] = useState<any[]>([]);
    const [extraBills, setExtraBills] = useState<any[]>([]);

    // Modal states
    const [showExtensionModal, setShowExtensionModal] = useState(false);
    const [showExtraBillModal, setShowExtraBillModal] = useState(false);
    const [showComplaintModal, setShowComplaintModal] = useState(false);
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [selectedKost, setSelectedKost] = useState<any>(null);

    // Rating form state
    const [ratingValue, setRatingValue] = useState(5);
    const [ratingComment, setRatingComment] = useState('');

    // Extension form state
    const [extensionPeriod, setExtensionPeriod] = useState(1);
    const [extensionProof, setExtensionProof] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

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
        }
    }, [user]);

    const fetchMyKosts = async () => {
        setLoading(true);
        try {
            console.log('Fetching My Kosts for user:', user.uid);
            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .eq('user_id', user.uid);

            if (error) throw error;
            
            const kostsData: any[] = [];
            data?.forEach((doc) => {
                const isRent = doc.product_type === 'rent' || doc.type === 'sewa_kost' || !doc.product_type || doc.category === 'kost';
                const isApproved = ['approved', 'paid', 'Selesai', 'success', 'Berhasil'].includes(doc.status);

                if (isRent && isApproved) {
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
                    const rawImages = doc.image_urls || metadata.imageUrls || [];
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

                    kostsData.push({ 
                      id: doc.id, 
                      kostName: doc.kost_name || metadata.kostName,
                      kostId: doc.kost_id || doc.product_id,
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

            // Fetch extra bills
            const bills = await getExtraBills(user.uid);

            // Injeksi data dummy untuk audit UI/UX
            const dummyKost = {
                id: 'dummy-123',
                kostName: 'Kost Madani Eksklusif (Simulasi)',
                kostId: 'dummy-property-id',
                roomType: 'Deluxe Room A',
                duration: 1,
                period: 'Bulanan',
                basePrice: 2500000,
                moveInDate: new Date().toISOString(),
                endDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
                daysRemaining: 4,
                totalPrice: 2500000,
                status: 'Selesai',
                displayImage: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=2070',
                location: 'Jl. Margonda Raya No. 123',
                city: 'Depok',
                pendingBills: [
                    { id: 'b-dummy-1', bill_name: 'Tagihan Listrik (Januari)', amount: 150000, status: 'pending', created_at: new Date().toISOString() },
                    { id: 'b-dummy-2', bill_name: 'Iuran WiFi & Sampah', amount: 75000, status: 'pending', created_at: new Date().toISOString() }
                ],
                totalPendingBills: 225000
            };
            kostsData.push(dummyKost);

            // Associate extra bills with real kosts
            const activeWithBills = kostsData.map(k => {
                if (k.id === 'dummy-123') return k;
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

    return (
        <div className="min-h-screen bg-[#F8FAFC] pt-20 pb-12 font-outfitSelection">
            {/* Background Decorations */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-orange-100/30 rounded-full blur-[120px]" />
                <div className="absolute top-[20%] -left-[10%] w-[30%] h-[30%] bg-blue-100/20 rounded-full blur-[100px]" />
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                {/* Header */}
                <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-5">
                        <button
                            onClick={() => onPageChange(Page.HOME)}
                            className="group p-3 bg-white hover:bg-orange-500 rounded-2xl shadow-sm border border-gray-100 transition-all duration-300"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" />
                        </button>
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">Kost Saya</h1>
                            <p className="text-gray-500 text-sm mt-1 font-medium flex items-center gap-1.5">
                                <Zap className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
                                Kelola hunian aktif Anda dengan mudah
                            </p>
                        </div>
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

                {activeKosts.length === 0 ? (
                    <div className="space-y-12">
                        {/* Enhanced Empty State Card */}
                        <div className="relative overflow-hidden bg-white/70 backdrop-blur-xl rounded-[3rem] p-12 text-center border border-white shadow-2xl shadow-gray-200/50 flex flex-col items-center justify-center animate-in zoom-in-95 duration-700">
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <Search className="w-32 h-32" />
                            </div>
                            
                            <div className="relative">
                                <div className="w-28 h-28 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center mb-8 shadow-2xl shadow-orange-300 border-4 border-white">
                                    <AlertCircle className="w-12 h-12 text-white" />
                                </div>
                                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg">
                                    <Clock className="w-5 h-5 text-orange-500" />
                                </div>
                            </div>

                            <h3 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Belum Ada Kost Aktif</h3>
                            <p className="text-gray-500 max-w-sm mx-auto mb-10 font-medium leading-relaxed">
                                Sepertinya Anda belum memiliki hunian yang aktif. Jangan khawatir, hunian impian Anda hanya berjarak satu klik saja!
                            </p>
                            
                            <button
                                onClick={() => onPageChange(Page.LISTINGS)}
                                className="group bg-orange-500 hover:bg-orange-600 text-white px-10 py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest transition-all shadow-2xl shadow-orange-200 active:scale-95 flex items-center gap-3"
                            >
                                Mulai Cari Sekarang
                                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>

                        {/* Property Recommendations */}
                        {recommendations.length > 0 && (
                            <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
                                <div className="flex items-center justify-between mb-6 px-4">
                                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Rekomendasi Terpopuler</h2>
                                    <button onClick={() => onPageChange(Page.LISTINGS)} className="text-orange-500 text-sm font-black flex items-center gap-1 hover:gap-2 transition-all">
                                        Lihat Semua <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                    {recommendations.map(prop => (
                                        <div 
                                            key={prop.id} 
                                            className="group bg-white rounded-[2rem] overflow-hidden border border-gray-100 shadow-xl shadow-gray-200/50 hover:shadow-2xl transition-all duration-500 cursor-pointer"
                                            onClick={() => onPageChange(Page.LISTINGS)} // In real app, go to detail
                                        >
                                            <div className="relative h-48 overflow-hidden">
                                                <img 
                                                    src={prop.displayImage || 'https://via.placeholder.com/400x300'} 
                                                    alt={prop.title} 
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                />
                                                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                                                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                                    <span className="text-[10px] font-black">{prop.rating || '5.0'}</span>
                                                </div>
                                                <button className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-md rounded-full text-gray-400 hover:text-red-500 transition-colors">
                                                    <Heart className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div className="p-5">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">{prop.type || 'Kost'}</span>
                                                    <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                                                        <MapPin className="w-3 h-3" /> {prop.city}
                                                    </span>
                                                </div>
                                                <h4 className="font-black text-gray-900 mb-3 line-clamp-1">{prop.title}</h4>
                                                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                                    <p className="text-orange-600 font-black">
                                                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(prop.price)}
                                                        <span className="text-[10px] text-gray-400 font-bold ml-1">/ Bln</span>
                                                    </p>
                                                    <div className="p-2 bg-orange-50 rounded-lg group-hover:bg-orange-500 group-hover:text-white transition-colors">
                                                        <ChevronRight className="w-4 h-4" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-10">
                        {activeKosts.map((kost) => (
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

                                        <div className="flex-1">
                                                <div className="flex flex-col gap-2">
                                                    <button 
                                                        onClick={() => onPageChange('products', { id: kost.kostId })}
                                                        className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight tracking-tight text-left hover:text-orange-500 transition-colors group/title flex items-center gap-3"
                                                    >
                                                        {kost.kostName || 'Kost Tersembunyi'}
                                                        <ChevronRight className="w-8 h-8 opacity-0 -translate-x-4 group-hover/title:opacity-100 group-hover/title:translate-x-0 transition-all text-orange-500" />
                                                    </button>
                                                    {/* Quick Rating Stars */}
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
                                                </div>
                                                {kost.daysRemaining !== null && (
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
                                                <span className="flex items-center gap-2.5 text-emerald-600 bg-emerald-50/80 backdrop-blur-sm px-5 py-2.5 rounded-2xl border border-emerald-100 text-[11px] font-black uppercase tracking-wider">
                                                    <CheckCircle className="w-4 h-4" /> SEDANG DISEWA
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stats Grid */}
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
                                </div>

                                {/* Actions Column */}
                                <div className="flex flex-col gap-4 lg:w-80 shrink-0 justify-center relative z-10">
                                    <div className="grid grid-cols-1 gap-4">
                                        <button
                                            onClick={() => {
                                                const query = `${kost.kostName} ${kost.location || ''} ${kost.city || ''}`.trim();
                                                window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, '_blank');
                                            }}
                                            className="bg-gray-900 hover:bg-emerald-600 text-white px-8 py-5 rounded-[1.5rem] font-black flex items-center justify-center gap-3 transition-all text-[13px] shadow-2xl shadow-gray-300 active:scale-95 group/loc"
                                        >
                                            <MapPin className="w-5 h-5 group-hover/loc:-translate-y-0.5 transition-transform" /> LIHAT LOKASI KOST
                                        </button>

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
                                    </div>

                                    <div className="grid grid-cols-1 gap-3">
                                        <button
                                            onClick={() => {
                                                const phone = '628123456789';
                                                const text = `Halo RuangSinggah! Saya ${user.name || 'Penyewa'}, penyewa di ${kost.kostName}. Saya ingin bertanya mengenai...`;
                                                window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
                                            }}
                                            className="bg-white border-2 border-gray-100 hover:border-emerald-500 hover:text-emerald-600 text-gray-700 px-4 py-4 rounded-2xl font-black flex items-center justify-center gap-2.5 transition-all text-[11px] group/item"
                                        >
                                            <Smartphone className="w-4 h-4 group-hover/item:-translate-y-0.5 transition-transform" /> HUBUNGI PEMILIK
                                        </button>
                                    </div>

                                    <button
                                        onClick={() => handleOpenComplaint(kost)}
                                        className="w-full bg-white border-2 border-gray-100 hover:border-red-500 hover:bg-red-50 hover:text-red-600 text-gray-500 px-4 py-4 rounded-2xl font-black flex items-center justify-center gap-3 transition-all text-[11px] mt-2 group/comp"
                                    >
                                        <MessageSquare className="w-4 h-4 group-hover/comp:-translate-y-0.5 transition-transform" /> AJUKAN KOMPLAIN
                                    </button>
                                </div>
                            </div>
                        ))}
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

// Quick explicit mock CheckCircleIcon component since it's not exported differently from lucide
function CheckCircleIcon(props: any) {
    return (
        <svg fill="currentColor" viewBox="0 0 20 20" {...props}>
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
    );
}

export default MyKost;
