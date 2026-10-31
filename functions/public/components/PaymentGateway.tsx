import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Lock, 
  CheckCircle2, 
  QrCode, 
  Building2, 
  Smartphone, 
  Wallet, 
  CreditCard, 
  Clock, 
  ChevronRight, 
  ChevronDown, 
  Copy, 
  Check, 
  Download, 
  ArrowLeft, 
  ArrowRight,
  X, 
  Receipt, 
  RefreshCw, 
  ExternalLink, 
  AlertCircle 
} from 'lucide-react';
import { FORMAT_CURRENCY } from '../constants';
import { supabase } from '../supabase';
import { notificationService } from '../notificationService';
import { notifyAdminStatusUpdate, notifyAdminTransaction } from '../emailService';
import { syncResidentStatus, syncSurveyRequest, syncKostManagerRequest } from '../adminService';
import { Transaction } from '../types';

interface PaymentGatewayProps {
  amount: number;
  orderId: string;
  productId: string;
  productType: 'database' | 'kost_booking' | 'survey' | 'kost' | 'property' | 'perpanjangan_sewa' | string;
  userId: string;
  metadata?: any;
  existingOrderId?: string;
  isAdmin?: boolean;
  onPaymentSuccess: (orderId?: string) => void;
  onCancel: () => void;
}

const PAID_STATUSES = ['PAID', 'SUCCESS', 'SETTLEMENT', 'CAPTURE', 'BERHASIL'];

const PaymentGateway: React.FC<PaymentGatewayProps> = ({ 
  amount, 
  orderId, 
  productId, 
  productType, 
  userId, 
  metadata = {},
  existingOrderId,
  isAdmin: isAdminProp,
  onPaymentSuccess, 
  onCancel 
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const hasInitialized = useRef(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Dynamic remaining seconds calculation (SLA-aware)
  const isRentRelated = ['kost_booking', 'rent', 'kost', 'property', 'perpanjangan_sewa', 'tagihan_ekstra'].includes((productType || '').toLowerCase());
  const defaultWindowSecs = isRentRelated ? 86400 : 10800; // 24 Jam untuk sewa kost, 3 Jam untuk produk lainnya
  const [timeLeft, setTimeLeft] = useState<number>(defaultWindowSecs);

  const [currentOrder, setCurrentOrder] = useState<Transaction | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [directData, setDirectData] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [config, setConfig] = useState<{ activeGateway: string; midtransEnv: string; midtransClientKey: string; paymentMethods?: any[] } | null>(null);
  const [selectedGateway, setSelectedGateway] = useState<string>('MIDTRANS');
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);

  const [showDetails, setShowDetails] = useState(false);
  const [availableMethods, setAvailableMethods] = useState<any[]>([]);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [showCopied, setShowCopied] = useState(false);
  const successTriggered = useRef(false);

  // Helper untuk menghitung sisa detik pembayaran secara presisi
  const getRemainingSeconds = (order: Transaction | null): number => {
    const windowSecs = isRentRelated ? 86400 : 10800;
    if (!order) return windowSecs;

    const orderMeta = typeof order.metadata === 'string' ? JSON.parse(order.metadata) : (order.metadata || {});
    // Prioritas: approved_at > updated_at > created_at
    const baseTimeStr = orderMeta.approved_at || (order as any).approved_at || order.updated_at || order.created_at;
    if (!baseTimeStr) return windowSecs;

    const baseTimeMs = new Date(baseTimeStr).getTime();
    if (isNaN(baseTimeMs)) return windowSecs;

    const expiryMs = baseTimeMs + (windowSecs * 1000);
    const nowMs = Date.now();
    const diffSecs = Math.floor((expiryMs - nowMs) / 1000);

    return Math.min(windowSecs, Math.max(0, diffSecs));
  };

  useEffect(() => {
    let timer: any;
    
    // Perhitungan awal saat order berubah
    const initialSecs = getRemainingSeconds(currentOrder);
    setTimeLeft(initialSecs);

    if (currentOrder && !PAID_STATUSES.includes((currentOrder.status || '').toUpperCase()) && currentOrder.status !== 'expired') {
      timer = setInterval(() => {
        const remaining = getRemainingSeconds(currentOrder);
        setTimeLeft(remaining);
        if (remaining <= 0) {
          clearInterval(timer);
          if (['pending', 'awaiting_payment'].includes((currentOrder.status || '').toLowerCase())) {
            setCurrentOrder(prev => prev ? { ...prev, status: 'expired' } : prev);
          }
        }
      }, 1000);
    } else if (!currentOrder) {
      timer = setInterval(() => {
        setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    } else if (currentOrder?.status === 'expired') {
      setTimeLeft(0);
    }

    return () => { if (timer) clearInterval(timer); };
  }, [currentOrder, productType]);

  // Check admin status
  useEffect(() => {
    if (isAdminProp !== undefined) {
      setIsAdmin(isAdminProp);
      return;
    }

    const checkAdmin = async () => {
      if (!userId) return;
      try {
        const { data, error } = await supabase
          .from('users')
          .select('is_admin, role')
          .eq('id', userId)
          .maybeSingle();
          
        if (error) return;
        if (data) {
          const isAdm = data.is_admin === true || data.is_admin === 1 || data.role === 'admin';
          setIsAdmin(isAdm);
        }
      } catch (err) {
        console.error("checkAdmin error:", err);
      }
    };
    checkAdmin();
  }, [userId, isAdminProp]);

  useEffect(() => {
    (async () => {
      const urlOrderId = searchParams.get('orderId');
      const effectiveOrderId = existingOrderId || urlOrderId;

      if (!effectiveOrderId) {
        hasInitialized.current = true;
        return;
      }

      if (currentOrder?.id === effectiveOrderId || currentOrder?.pakasir_order_id === effectiveOrderId) {
        return;
      }

      setIsProcessing(true);
      try {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const isUuid = uuidRegex.test(effectiveOrderId);
        
        let query = supabase.from('transactions').select('*');
        if (isUuid) {
          query = query.eq('id', effectiveOrderId);
        } else {
          query = query.eq('pakasir_order_id', effectiveOrderId);
        }

        const { data: order, error } = await query.maybeSingle();
        if (error) throw error;
        
        if (order) {
          setCurrentOrder(order);
          if (order.payment_method) {
             setSelectedMethod(order.payment_method);
             if (order.metadata?.midtrans_charge_response) {
                setDirectData(order.metadata.midtrans_charge_response);
                setShowCheckout(true);
             }
          }
        }
      } catch (err: any) {
        console.error("fetchOrder error:", err);
        setError('Gagal memuat detail tagihan: ' + err.message);
      } finally {
        setIsProcessing(false);
        hasInitialized.current = true;
      }
    })();
  }, [existingOrderId]);

  // Fetch Gateway Config
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch(`https://getpaymentconfig-hzxlewhsuq-uc.a.run.app?t=${Date.now()}`);
        if (response.ok) {
          const data = await response.json();
          setConfig(data);
          setSelectedGateway(data.activeGateway === 'PAKASIR' ? 'PAKASIR' : 'MIDTRANS');
          if (data.paymentMethods) {
            setAvailableMethods(data.paymentMethods);
          }
        }
      } catch (err) {
        console.error("Failed to fetch gateway config:", err);
      }
    };
    fetchConfig();
  }, []);

  // Real-time Monitoring & Status Sync
  useEffect(() => {
    const orderId = currentOrder?.id;
    if (!orderId) return;

    const isPaid = PAID_STATUSES.includes((currentOrder.status || '').toUpperCase());
    
    if (isPaid) {
      if (successTriggered.current) return;
      successTriggered.current = true;

      notifyAdminStatusUpdate("Pembayaran Gateway", orderId, "PAID", {
        "Tipe Produk": productType,
        "User ID": userId
      }).catch(e => console.error("Admin notify error:", e));

      const m = (metadata || {}) as any;
      const isDatabase = productType === 'database' || productType === 'available_database';
      
      notificationService.createNotification(
        userId,
        isDatabase ? 'Database Terkirim!' : productType === 'survey' ? 'Pesanan Survey Berhasil!' : 'Pembayaran Berhasil!',
        isDatabase 
          ? `Database ${m.name || m.area || 'Kost'} telah dikirim ke email Anda. Silakan cek Inbox atau folder Spam.`
          : productType === 'survey'
            ? `Pembayaran Jasa Survey ${m.kostName || 'Kost'} senilai Rp ${amount.toLocaleString('id-ID')} telah berhasil diverifikasi.`
            : `Pembayaran sewa ${m.kostName || 'Kost'} senilai Rp ${amount.toLocaleString('id-ID')} telah berhasil diverifikasi.`,
        'payment',
        {},
        isDatabase ? 'https://mail.google.com/mail/u/0/#search/RuangSinggah' : '/my-kost'
      ).catch(err => console.error("Failed to create payment notification:", err));
      
      if (['rent', 'kost_booking', 'tagihan_ekstra', 'property', 'kost', 'perpanjangan_sewa'].includes(productType)) {
          syncResidentStatus(orderId).catch(e => console.error("Sync error:", e));
      }

      if (productType === 'survey' || productType === 'kostmanager' || productType === 'kostmanager_subscription') {
           syncSurveyRequest(orderId).catch(e => console.error("Sync error:", e));
           if (productType === 'kostmanager' || productType === 'kostmanager_subscription') {
               syncKostManagerRequest(orderId).catch(e => console.error("Sync error:", e));
           }
      }
      return;
    }

    // Real-time Supabase subscription
    const channel = supabase
      .channel(`monitor-${orderId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions', filter: `id=eq.${orderId}` },
        (payload) => {
          const newStatus = payload.new.status?.toUpperCase() || '';
          if (PAID_STATUSES.includes(newStatus)) {
            setCurrentOrder(payload.new as Transaction);
          }
        }
      )
      .subscribe();

    // Polling fallback (3 detik)
    const pollInterval = setInterval(async () => {
      const { data } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', orderId)
        .single();

      if (data) {
        const dbStatus = (data.status || '').toUpperCase();
        if (PAID_STATUSES.includes(dbStatus)) {
           setCurrentOrder(data as Transaction);
        }
      }
    }, 3000);

    return () => {
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
  }, [currentOrder?.id, currentOrder?.status, amount, metadata, productType, userId]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Load Midtrans Snap Script
  useEffect(() => {
    if (!config) return;

    const isProd = config.midtransEnv === 'PRODUCTION';
    const snapSrc = isProd 
      ? "https://app.midtrans.com/snap/snap.js" 
      : "https://app.sandbox.midtrans.com/snap/snap.js";
    
    const clientKey = config.midtransClientKey; 
    
    const existingScript = document.getElementById('midtrans-snap-script');
    if (existingScript) existingScript.remove();

    const script = document.createElement('script');
    script.id = 'midtrans-snap-script';
    script.src = snapSrc;
    script.setAttribute('data-client-key', clientKey);
    script.async = true;
    document.body.appendChild(script);

    return () => {
      const scriptToRemove = document.getElementById('midtrans-snap-script');
      if (scriptToRemove) document.body.removeChild(scriptToRemove);
    };
  }, [config]);

  const handlePay = async (method?: string) => {
    setIsProcessing(true);
    setError(null);
    try {
      const endpoint = selectedGateway === 'MIDTRANS' 
        ? 'https://createmidtranspayment-hzxlewhsuq-uc.a.run.app'
        : 'https://createpakasirpayment-hzxlewhsuq-uc.a.run.app';

      const response = await fetch(endpoint, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          productId, 
          productType, 
          userId, 
          amount, 
          paymentMethod: method,
          existingOrderId: orderId,
          item_details: metadata?.item_details || undefined,
          metadata: {
              ...metadata,
              userName: metadata?.userName || 'Customer',
              userEmail: metadata?.userEmail || '',
              userPhone: metadata?.userPhone || '',
              userAddress: metadata?.userAddress || ''
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Gagal menghubungi server pembayaran');
      }
      
      const result = await response.json();

      const targetOrderId = result.orderId || result.order?.id || orderId;
      if (targetOrderId) {
        notifyAdminTransaction(`Pembuatan Transaksi (${productType})`, {
          "Order ID": targetOrderId,
          "Tipe Produk": productType,
          "Total Bayar": `Rp ${amount.toLocaleString('id-ID')}`,
          "Email Pembeli": metadata?.userEmail || metadata?.email || 'Customer',
          "Status": "PENDING (Menunggu Pembayaran)"
        }).catch(e => console.warn("Admin notify error:", e));
      }

      if (result.directPayment) {
        setDirectData(result.directPayment);
        if (method) setSelectedMethod(method);
        if (result.redirect_url) setRedirectUrl(result.redirect_url);
        setShowCheckout(true);
        setIsProcessing(false);
        
        if (result.order) {
            setCurrentOrder(result.order);
        }

        if (result.orderId) {
          setSearchParams({ orderId: result.orderId });
        }

        const deeplink = result.directPayment?.actions?.find((a: any) => 
            a.name === 'deeplink-redirect' || a.name === 'shopeepay-deeplink' || a.url?.includes('deeplink')
        )?.url;

        if (deeplink && (method === 'gopay' || method === 'shopeepay')) {
            window.location.href = deeplink;
            return;
        }
      } else if (selectedGateway === 'MIDTRANS' && result.token) {
        if (result.redirect_url) setRedirectUrl(result.redirect_url);
        if (result.order) {
            setCurrentOrder(result.order);
        }

        if (method === 'dana' && result.redirect_url) {
            window.location.href = result.redirect_url;
            return;
        }

        setShowCheckout(true);
        setTimeout(() => {
          // @ts-ignore
          window.snap.pay(result.token, {
            onSuccess: (res: any) => onPaymentSuccess(result.orderId),
            onPending: (res: any) => { alert('Pembayaran tertunda.'); onCancel(); },
            onError: (res: any) => setError('Pembayaran gagal.'),
            onClose: () => setIsProcessing(false)
          });
          setIsProcessing(false);
        }, 500);
      } else if (result.checkoutUrl || result.redirect_url) {
        const targetUrl = result.checkoutUrl || result.redirect_url;
        window.location.href = targetUrl;
      } else {
        throw new Error('Gagal mendapatkan respon pembayaran yang valid');
      }
    } catch (err: any) {
      console.error(`${selectedGateway} Error:`, err);
      setIsProcessing(false);
      setError(err.message);
    }
  };

  const copyToClipboard = (text: string) => {
    if (!text) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        setShowCopied(true);
        setTimeout(() => setShowCopied(false), 2000);
      }).catch(() => fallbackCopyTextToClipboard(text));
    } else {
      fallbackCopyTextToClipboard(text);
    }
  };

  const fallbackCopyTextToClipboard = (text: string) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    } catch (err) {
      console.error('Fallback copy failed', err);
    }
    document.body.removeChild(textArea);
  };

  const getTutorial = () => {
    const method = selectedMethod?.toLowerCase() || '';
    
    if (method === 'qris' || method === 'gopay' || method === 'ovo' || method === 'dana' || method === 'shopeepay') {
      return [
        "Buka aplikasi e-wallet Anda (GoPay, OVO, DANA, BCA mobile, dll).",
        "Pilih menu 'Scan' atau 'Bayar'.",
        "Arahkan kamera ke QR Code di layar atau gunakan file dari galeri.",
        "Periksa nominal tagihan yang tertera & konfirmasi pembayaran.",
        "Masukkan PIN Anda. Transaksi akan otomatis terverifikasi sistem."
      ];
    }
    
    if (method === 'bca_va') {
      return [
        "Buka m-BCA, pilih menu 'm-Transfer'.",
        "Pilih 'BCA Virtual Account'.",
        "Masukkan nomor Virtual Account di atas & klik 'Send'.",
        "Pastikan nama & nominal tagihan sesuai, lalu masukkan PIN m-BCA.",
        "Pembayaran berhasil terverifikasi otomatis."
      ];
    }

    if (method === 'bni_va') {
      return [
        "Buka BNI Mobile Banking, pilih menu 'Transfer'.",
        "Pilih 'Virtual Account Billing'.",
        "Pilih rekening debet & masukkan nomor Virtual Account.",
        "Konfirmasi transaksi & masukkan Password Transaksi Anda.",
        "Pembayaran berhasil terverifikasi otomatis."
      ];
    }

    if (method === 'bri_va') {
      return [
        "Buka aplikasi BRImo, pilih menu 'BRIVA'.",
        "Pilih 'Pembayaran Baru' & masukkan nomor BRIVA.",
        "Pastikan data transaksi sesuai, lalu klik 'Bayar'.",
        "Masukkan PIN BRImo Anda.",
        "Pembayaran berhasil terverifikasi otomatis."
      ];
    }

    if (method === 'mandiri_va') {
      return [
        "Buka Livin' by Mandiri, pilih menu 'Bayar'.",
        "Cari penyedia jasa atau masukkan Kode Biller.",
        "Masukkan Bill Key / nomor Virtual Account.",
        "Konfirmasi tagihan & masukkan PIN Livin'.",
        "Pembayaran berhasil terverifikasi otomatis."
      ];
    }

    if (method === 'cimb_va') {
      return [
        "Buka OCTO Mobile, pilih menu 'Transfer'.",
        "Pilih 'Transfer ke Rekening CIMB Niaga Lain'.",
        "Masukkan nomor Virtual Account CIMB Niaga.",
        "Masukkan nominal & konfirmasi dengan PIN OCTO.",
        "Pembayaran berhasil terverifikasi otomatis."
      ];
    }

    if (method === 'permata_va') {
      return [
        "Buka PermataMobile X atau ATM Permata, pilih 'Transfer'.",
        "Pilih rekening tujuan Virtual Account.",
        "Masukkan nomor Virtual Account & nominal yang sesuai.",
        "Konfirmasi transaksi & selesaikan pembayaran."
      ];
    }

    if (method === 'alfamart' || method === 'indomaret') {
      const store = method === 'alfamart' ? 'Alfamart' : 'Indomaret';
      return [
        `Kunjungi gerai ${store} terdekat.`,
        "Sampaikan kepada Kasir bahwa Anda ingin membayar tagihan RuangSinggah.",
        "Tunjukkan Kode Pembayaran yang tertera di atas kepada Kasir.",
        "Bayar sesuai jumlah nominal tagihan yang disebutkan Kasir.",
        "Simpan struk pembayaran sebagai bukti transaksi resmi."
      ];
    }

    return [
      "Buka aplikasi perbankan atau e-wallet pilihan Anda.",
      "Pilih menu pembayaran yang sesuai (Virtual Account / Transfer).",
      "Masukkan nomor pembayaran yang tertera.",
      "Pastikan nominal tagihan sesuai & konfirmasi transaksi.",
      "Pembayaran akan otomatis terdeteksi oleh sistem RuangSinggah."
    ];
  };

  const handleDownloadQR = async (qrData: string) => {
    try {
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrData)}&size=500x500&margin=20`;
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `QRIS_RuangSinggah_${orderId.replace(/#/g, '')}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download Error:", err);
      alert("Gagal mengunduh QRIS. Anda dapat langsung melakukan screenshot layar.");
    }
  };

  const handleSimulatePayment = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch('https://simulatepaymentsuccess-hzxlewhsuq-uc.a.run.app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          orderId: currentOrder?.id,
          adminUserId: userId 
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Gagal simulasi');
    } catch (err: any) {
      alert("Simulasi Gagal: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const isSandbox = JSON.stringify(directData || {}).toUpperCase().includes('SANDBOX');
  const currentStatus = (currentOrder?.status || '').toLowerCase();
  const showAdminSim = (isAdmin || isAdminProp) && (
    !currentStatus || 
    ['pending', 'awaiting_payment', 'pending_approval', 'approved', 'created', 'new', 'unpaid', 'success', 'paid'].includes(currentStatus) ||
    showCheckout
  );

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-0 sm:p-4 overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity" onClick={onCancel} />

      {/* Main Dialog Modal */}
      <div className={`relative bg-white w-full h-full sm:max-w-xl md:max-w-2xl sm:rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-300 ${
        showCheckout ? 'sm:h-auto sm:max-h-[92vh]' : 'sm:h-auto max-h-[95vh]'
      }`}>
        
        {/* Loading Overlay */}
        {isProcessing && (
          <div className="absolute inset-0 z-[200] bg-white/70 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-200">
             <div className="w-12 h-12 border-3 border-orange-200 border-t-orange-500 rounded-full animate-spin mb-4" />
             <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Menghubungkan ke Gateway Pembayaran...</h3>
             <p className="text-[11px] font-medium text-slate-400 mt-1">Enkripsi pembayaran aman sedang diproses...</p>
          </div>
        )}

        {/* 1. Header Resmi RuangSinggah.id */}
        <div className="px-5 py-3 sm:px-6 sm:py-3.5 bg-slate-900 text-white flex-shrink-0 relative overflow-hidden border-b border-slate-800">
          {/* Subtle Ambient Brand Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-transparent rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
          
          <div className="relative z-10 flex items-center justify-between gap-3">
            {/* Brand Logo & Order ID */}
            <div className="flex items-center gap-2.5 min-w-0">
              <img 
                src="/logo.png" 
                alt="RuangSinggah.id" 
                className="h-7 w-auto object-contain shrink-0" 
              />
              <div className="flex flex-col">
                <span className="font-extrabold text-sm sm:text-base tracking-tight text-white leading-none">
                  Ruang<span className="text-orange-500">Singgah</span><span className="text-slate-400">.id</span>
                </span>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  Order ID: <span className="text-slate-200 font-bold">#{currentOrder?.id?.split('-').pop()?.toUpperCase() || orderId}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {showCheckout && (
                <button 
                  onClick={() => { setShowCheckout(false); setSelectedMethod(null); setDirectData(null); }}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[11px] font-bold transition-all border border-slate-700 flex items-center gap-1 active:scale-95 cursor-pointer"
                  title="Ganti Metode Pembayaran"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Ganti Metode</span>
                </button>
              )}
              <button 
                onClick={onCancel} 
                className="p-1.5 sm:p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-all border border-slate-700/80 active:scale-95 cursor-pointer"
                title="Tutup"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* 2. Total Tagihan & Timer Countdown (Satu Baris Kompak / Zero Vertical Waste) */}
        <div className="bg-slate-50 border-b border-slate-200/80 px-5 py-3 sm:px-6 sm:py-3.5 flex flex-col gap-2.5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-500 block leading-tight">Total Pembayaran</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <p className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-none">
                  {FORMAT_CURRENCY(amount)}
                </p>
                <button 
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-[10px] font-bold text-orange-600 hover:text-orange-700 uppercase tracking-wider flex items-center gap-0.5 transition-colors cursor-pointer"
                >
                  {showDetails ? 'Tutup' : 'Rincian'}
                  <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showDetails ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>

            {/* Countdown Timer Pill Kompak */}
            <div className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 shrink-0 transition-all ${
              timeLeft < 300 
                ? 'bg-rose-50 border-rose-200 text-rose-700 animate-pulse' 
                : 'bg-amber-50/90 border-amber-200/80 text-amber-900'
            }`}>
              <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <div className="flex items-baseline gap-1">
                <span className="text-[9px] font-semibold uppercase text-slate-500 hidden sm:inline">Batas:</span>
                <span className={`text-xs font-mono font-bold tracking-tight ${timeLeft < 300 ? 'text-rose-600' : 'text-amber-950'}`}>
                  {formatTime(timeLeft)}
                </span>
              </div>
            </div>
          </div>

          {/* Accordion Rincian Item */}
          {showDetails && (
            <div className="pt-3.5 border-t border-slate-200/80 space-y-2 text-xs animate-in slide-in-from-top-2 duration-200">
              {(() => {
                const items = metadata?.item_details || [
                  { name: metadata?.billName || metadata?.kostName || 'Total Pembayaran', price: amount }
                ];
                return items.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center text-slate-600">
                    <span className="font-medium">{item.name || item.bill_name || 'Item'}</span>
                    <span className="font-bold text-slate-900">{FORMAT_CURRENCY(item.price || item.amount || 0)}</span>
                  </div>
                ));
              })()}
              <div className="pt-2 border-t border-slate-200/60 flex justify-between items-center text-[11px]">
                <span className="font-bold text-slate-500 uppercase tracking-wider">Biaya Layanan & Pajak</span>
                <span className="font-bold text-emerald-600 uppercase tracking-wider">Termasuk (Gratis)</span>
              </div>
            </div>
          )}
        </div>

        {/* 3. Content Area */}
        <div className="flex-grow overflow-y-auto bg-white flex flex-col p-4 sm:p-6">
          {currentOrder?.status === 'expired' ? (
            /* Expired View */
            <div className="flex flex-col items-center justify-center text-center p-8 space-y-4 my-auto">
               <div className="w-14 h-14 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center text-rose-500 mb-1">
                 <AlertCircle className="w-7 h-7" />
               </div>
               <h3 className="text-base font-bold text-slate-900 uppercase tracking-tight">Waktu Pembayaran Telah Berakhir</h3>
               <p className="text-xs font-normal text-slate-500 max-w-sm leading-relaxed">
                 Sesi pembayaran ini telah kadaluarsa karena telah melewati batas waktu SLA. Silakan ajukan pesanan ulang untuk mengamankan ketersediaan.
               </p>
               <button 
                 onClick={onCancel} 
                 className="mt-4 bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold uppercase text-xs tracking-wider hover:bg-orange-600 transition-colors cursor-pointer"
               >
                 Tutup
               </button>
            </div>
          ) : PAID_STATUSES.includes((currentOrder?.status || '').toUpperCase()) ? (
            /* Success View */
            <div className="flex flex-col items-center justify-center text-center p-6 space-y-5 my-auto animate-in zoom-in-95 duration-300">
               <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 shadow-xs">
                 <CheckCircle2 className="w-8 h-8" />
               </div>
               
               <div className="space-y-1">
                 <h2 className="text-2xl font-black text-slate-900 tracking-tight">Pembayaran Berhasil!</h2>
                 <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                   Transaksi Terverifikasi • #{currentOrder?.id?.slice(0, 8).toUpperCase()}
                 </p>
               </div>

               <div className="w-full max-w-sm bg-slate-50 rounded-2xl p-5 border border-slate-200/80 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Tipe Produk</span>
                    <span className="text-slate-900 font-black">
                      {productType === 'database' ? 'Database Kost' : productType === 'survey' ? 'Jasa Survey Kost' : 'Sewa Kost'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Total Dibayar</span>
                    <span className="text-orange-600 font-black text-sm">{FORMAT_CURRENCY(amount)}</span>
                  </div>
                  <div className="pt-3 border-t border-slate-200 flex flex-col gap-1">
                    <p className="text-[11px] text-slate-500 font-medium">Kwitansi digital dan konfirmasi telah dikirimkan ke email Anda.</p>
                  </div>
               </div>

               <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
                  <button 
                    onClick={() => onPaymentSuccess(currentOrder?.id)} 
                    className="flex-grow bg-slate-900 text-white px-6 py-3.5 rounded-xl font-bold uppercase text-xs tracking-wider hover:bg-orange-600 transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                   >
                    <span>{productType === 'survey' ? 'Lihat di Kost Saya' : 'Lanjutkan ke Kost Saya'}</span>
                    <ArrowRight className="w-4 h-4" />
                   </button>
               </div>
            </div>
          ) : !showCheckout ? (
            /* Method Selection View */
            <div className="space-y-6">
              <div className="text-left">
                <h2 className="text-lg font-black text-slate-900 tracking-tight">Pilih Metode Pembayaran</h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Seluruh saluran pembayaran terverifikasi resmi dan terlindungi garansi transaksi.</p>
              </div>

              {error && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="w-full space-y-6">
                {(() => {
                  const displayCats = [
                    { id: 'none', name: 'Rekomendasi / Instan' },
                    { id: 'ewallet', name: 'E-Wallet' },
                    { id: 'va', name: 'Virtual Account (Transfer Bank)' },
                    { id: 'retail', name: 'Minimarket / Outlet' },
                    { id: 'paylater', name: 'Paylater' },
                    { id: 'card', name: 'Kartu Kredit / Debit' }
                  ];

                  return displayCats.map((cat) => {
                    const methods = availableMethods.filter(m => m.category === cat.id);
                    if (methods.length === 0) return null;

                    return (
                      <div key={cat.id} className="space-y-2.5">
                        <div className="flex items-center gap-3">
                           <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">{cat.name}</span>
                           <div className="flex-grow h-[1px] bg-slate-100" />
                        </div>

                        <div className="grid grid-cols-1 gap-2.5">
                          {methods.map((method) => {
                            const isQRIS = method.code === 'qris';
                            return (
                              <button 
                                key={method.code}
                                onClick={() => handlePay(method.code)}
                                disabled={isProcessing}
                                className={`group flex items-center gap-4 p-4 rounded-2xl border text-left transition-all relative cursor-pointer ${
                                  selectedMethod === method.code 
                                  ? 'border-orange-500 bg-orange-50/40 shadow-sm ring-2 ring-orange-500/20' 
                                  : 'border-slate-200 bg-white hover:border-orange-300 hover:shadow-xs'
                                } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                              >
                                <div className="w-11 h-11 bg-slate-50 border border-slate-150 rounded-xl flex items-center justify-center p-2 shrink-0">
                                  {method.iconUrl && !imageErrors[method.code] ? (
                                    <img 
                                        src={method.iconUrl} 
                                        alt={method.name} 
                                        className="w-full h-full object-contain" 
                                        onError={() => setImageErrors(prev => ({ ...prev, [method.code]: true }))}
                                    />
                                  ) : isQRIS ? (
                                    <QrCode className="w-6 h-6 text-slate-700" />
                                  ) : (
                                    <CreditCard className="w-6 h-6 text-slate-700" />
                                  )}
                                </div>
                                <div className="flex-grow min-w-0">
                                  <p className="font-bold text-xs uppercase tracking-wider text-slate-900 truncate">{method.name}</p>
                                  <p className="text-[10.5px] font-medium text-slate-400 mt-0.5">
                                    {isQRIS ? 'Otomatis Terdeteksi • Semua Bank & E-Wallet' : 'Konfirmasi Instan • Bebas Biaya Layanan'}
                                  </p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-orange-500 transition-colors shrink-0" />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          ) : (
            /* Direct Payment Instruction View */
            <div className="w-full flex flex-col items-center animate-in zoom-in-95 duration-200">
                {directData ? (
                  <div className="w-full flex flex-col items-center">
                    {selectedMethod === 'qris' || selectedMethod === 'gopay' || selectedMethod === 'ovo' || selectedMethod === 'dana' || selectedMethod === 'shopeepay' || (directData.payment_type === 'qris') ? (
                      /* QRIS Display */
                      <div className="space-y-6 w-full max-w-sm text-center">
                        <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-200 flex flex-col items-center">
                            {(() => {
                              const qrString = directData?.qr_string || 
                                               directData?.payment?.data || 
                                               directData?.qr_data || 
                                               directData?.payment_number || 
                                               directData?.data ||
                                               (directData?.actions?.find((a: any) => a.name === 'generate-qr-code')?.url);
                              
                              const qrAction = directData?.actions?.find((a: any) => a.name === 'generate-qr-code');
                              const qrUrl = qrAction?.url;
                              
                              if (!qrString && !qrUrl && !isProcessing) {
                                return <div className="w-full aspect-square bg-slate-50 rounded-xl flex items-center justify-center text-xs font-semibold text-slate-400 p-8 text-center">Data QRIS belum tersedia</div>;
                              }

                              const finalSrc = qrString 
                                ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrString)}&margin=10`
                                : qrUrl;

                              return (
                                <img 
                                    src={finalSrc} 
                                    alt="QRIS RuangSinggah" 
                                    className="w-full h-full max-w-[240px] aspect-square object-contain" 
                                />
                              );
                            })()}
                            <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-slate-500">
                                <QrCode className="w-4 h-4 text-orange-500" />
                                <span>Pindai menggunakan aplikasi m-Banking atau E-Wallet apa saja</span>
                            </div>
                        </div>

                        {/* Deeplink CTA */}
                        {(() => {
                            const deeplink = directData?.actions?.find((a: any) => a.name === 'deeplink-redirect' || a.name === 'shopeepay-deeplink' || a.url?.includes('deeplink'))?.url;
                            if (deeplink) {
                                return (
                                    <div className="space-y-2 w-full">
                                        <a 
                                            href={deeplink}
                                            className="block w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold uppercase tracking-wider text-xs text-center shadow-md active:scale-95 transition-all"
                                        >
                                            Buka Aplikasi {selectedMethod?.toUpperCase()}
                                        </a>
                                        <p className="text-[10px] font-medium text-slate-400">Klik untuk langsung membuka aplikasi e-wallet Anda</p>
                                    </div>
                                );
                            }
                            return null;
                        })()}

                        <div className="w-full">
                           <button 
                                onClick={() => {
                                    const qrString = directData?.qr_string || directData?.payment?.data || directData?.qr_data || directData?.payment_number || directData?.data;
                                    if (qrString) handleDownloadQR(qrString);
                                    else alert("Gagal mendapatkan data QRIS.");
                                }}
                                className="w-full flex items-center justify-center gap-2 bg-slate-100 text-slate-700 py-3 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-200 transition-all cursor-pointer"
                           >
                                <Download className="w-4 h-4" />
                                <span>Unduh QR Code</span>
                           </button>
                        </div>
                      </div>
                    ) : (
                      /* Virtual Account Display */
                      <div className="space-y-4 w-full max-w-sm text-center py-1">
                        <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-4">
                                {(() => {
                                    const midtransVa = directData?.va_numbers?.[0]?.va_number;
                                    const mandiriVa = directData?.bill_key;
                                    const permataVa = directData?.permata_va_number;
                                    const retailCode = directData?.payment_code;
                                    
                                    const codeToCopy = directData?.paymentNumber ||
                                                       (currentOrder?.metadata as any)?.payment_number || 
                                                       (currentOrder?.metadata as any)?.midtrans_charge_response?.va_numbers?.[0]?.va_number ||
                                                       midtransVa || 
                                                       mandiriVa || 
                                                       permataVa || 
                                                       retailCode || 
                                                       directData?.payment?.va_number || 
                                                       directData?.va_number || 
                                                       directData?.payment_number || 
                                                       directData?.pay_code || 
                                                       directData?.payment_code ||
                                                       (directData?.va_numbers && directData.va_numbers[0] ? directData.va_numbers[0].va_number : '') ||
                                                       '';
                                    
                                    if (!codeToCopy) {
                                      return (
                                        <div className="flex flex-col items-center gap-3 w-full py-2">
                                          <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                                            <AlertCircle className="w-5 h-5" />
                                          </div>
                                          <div className="text-center space-y-1">
                                            <p className="text-xs font-bold text-slate-800">Nomor Pembayaran Sedang Diproses</p>
                                            <p className="text-[11px] text-slate-500 max-w-[260px] leading-relaxed">
                                              Koneksi pembayaran sedang diperbarui. Silakan muat ulang kode atau ganti metode pembayaran.
                                            </p>
                                          </div>
                                          <button
                                            onClick={() => handlePay(selectedMethod || undefined)}
                                            className="mt-1 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl bg-slate-900 text-white hover:bg-orange-600 transition-all active:scale-95 cursor-pointer shadow-sm flex items-center gap-1.5"
                                          >
                                            <RefreshCw className="w-3.5 h-3.5" />
                                            <span>Muat Ulang Kode</span>
                                          </button>
                                        </div>
                                      );
                                    }

                                    return (
                                        <div className="flex flex-col items-center gap-4 w-full">
                                            <div className="flex flex-col items-center gap-1.5">
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                    {availableMethods.find(m => m.code === selectedMethod)?.name || 'Nomor Virtual Account'}
                                                </span>
                                                <p className="text-2xl font-black text-slate-900 tracking-wider font-mono">
                                                    {codeToCopy}
                                                </p>
                                                {(directData?.biller_code || directData?.bill_key) && (
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase">
                                                        {directData?.biller_code ? `Kode Biller: ${directData.biller_code}` : ''}
                                                        {directData?.biller_code && directData?.bill_key ? ' | ' : ''}
                                                        {directData?.bill_key ? `Bill Key: ${directData.bill_key}` : ''}
                                                    </p>
                                                )}
                                            </div>
                                            
                                            <button 
                                                onClick={() => copyToClipboard(codeToCopy)} 
                                                className={`px-5 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl border transition-all active:scale-95 flex items-center gap-2 cursor-pointer ${
                                                    showCopied 
                                                    ? 'border-emerald-500 text-emerald-600 bg-emerald-50' 
                                                    : 'border-slate-300 text-slate-800 bg-white hover:border-orange-500 hover:text-orange-600'
                                                }`}
                                            >
                                                {showCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                                                <span>{showCopied ? 'Berhasil Disalin!' : 'Salin Kode Bayar'}</span>
                                            </button>
                                        </div>
                                    );
                                })()}
                            </div>

                        {/* Tutorial Accordion */}
                        <div className="space-y-3 text-left">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Panduan Pembayaran</h3>
                            <ul className="text-xs font-medium text-slate-600 space-y-2 list-none bg-slate-50 p-4 rounded-xl border border-slate-200">
                                {getTutorial().map((step, idx) => (
                                    <li key={idx} className="flex gap-2.5 items-start">
                                        <span className="w-4 h-4 bg-white rounded-full flex items-center justify-center text-[10px] text-slate-700 font-bold border border-slate-200 shrink-0 mt-0.5">
                                          {idx + 1}
                                        </span>
                                        <span className="leading-snug">{step}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Snap Redirection Fallback */
                  <div className="w-full flex flex-col items-center justify-center py-12 px-4 text-center space-y-4">
                     <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 border border-orange-100">
                        <CreditCard className="w-7 h-7" />
                     </div>
                     <div className="space-y-1">
                        <h3 className="text-base font-bold text-slate-900 uppercase tracking-tight">Lanjutkan Pembayaran</h3>
                        <p className="text-xs font-normal text-slate-500 max-w-[280px]">Selesaikan pembayaran Anda melalui portal transaksi resmi RuangSinggah.</p>
                     </div>
                     <button 
                        onClick={() => handlePay(selectedMethod || undefined)}
                        className="w-full max-w-[260px] bg-slate-900 text-white py-3 rounded-xl font-bold uppercase tracking-wider text-xs hover:bg-orange-600 shadow-md active:scale-95 transition-all cursor-pointer"
                     >
                        Bayar Sekarang
                     </button>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Otomatis Terverifikasi • Enkripsi SSL 256-Bit</p>
                  </div>
                )}

               {/* Live Status Checking Strip */}
               <div className="w-full max-w-sm mt-6">
                  <div className="px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${
                        currentOrder?.status?.toUpperCase() === 'PAID' ? 'bg-emerald-500' : 'bg-orange-500 animate-pulse'
                      }`} />
                      <span className="text-[11px] font-semibold text-slate-600 truncate">
                        {currentOrder?.status?.toUpperCase() === 'PAID' ? 'Pembayaran Terverifikasi' : 'Menunggu pembayaran terdeteksi...'}
                      </span>
                    </div>

                    {currentOrder?.status?.toUpperCase() !== 'PAID' && (
                      <button 
                        onClick={async () => {
                            setIsProcessing(true);
                            try {
                                const { data } = await supabase.from('transactions').select('*').eq('id', currentOrder?.id).single();
                                if (data && PAID_STATUSES.includes((data.status || '').toUpperCase())) {
                                    setCurrentOrder(data as Transaction);
                                } else {
                                    alert("Pembayaran belum terdeteksi. Silakan selesaikan transfer di aplikasi m-Banking atau E-Wallet Anda terlebih dahulu.");
                                }
                            } catch (e) {
                                console.error(e);
                            } finally {
                                setIsProcessing(false);
                            }
                        }}
                        className="text-[11px] font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 shrink-0 cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Cek Status</span>
                      </button>
                    )}
                  </div>
               </div>

            </div>
          )}
        </div>

        {/* 4. Footer */}
        <div className="flex-shrink-0 px-5 py-2.5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-center text-[10.5px] text-slate-400 font-medium">
          <span className="flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-slate-400" />
            <span>Transaksi Resmi RuangSinggah.id</span>
          </span>
        </div>

      </div>
    </div>
  );
};

export default PaymentGateway;
