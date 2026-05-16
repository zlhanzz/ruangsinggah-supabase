import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FORMAT_CURRENCY } from '../constants';
import { supabase } from '../supabase';
import { notificationService } from '../notificationService';
import { notifyAdminStatusUpdate } from '../emailService';
import { syncResidentStatus, syncSurveyRequest } from '../adminService';
import { Transaction } from '../types';

interface PaymentGatewayProps {
  amount: number;
  orderId: string;
  productId: string;
  productType: 'database' | 'kost_booking' | 'survey' | 'kost' | 'property' | 'perpanjangan_sewa' | string; // Support for different products
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
  const [timeLeft, setTimeLeft] = useState(10800);
  const [currentOrder, setCurrentOrder] = useState<Transaction | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [directData, setDirectData] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [config, setConfig] = useState<{ activeGateway: string; midtransEnv: string; midtransClientKey: string; paymentMethods?: any[] } | null>(null);
  const [selectedGateway, setSelectedGateway] = useState<string>('MIDTRANS');
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);

  const pollIntervalRef = useRef<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [availableMethods, setAvailableMethods] = useState<any[]>([]);
  const [openCategory, setOpenCategory] = useState<string | null>('va');
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [showCopied, setShowCopied] = useState(false);
  const successTriggered = useRef(false);

  useEffect(() => {
    let timer: any;
    
    // Initial calculation immediately when currentOrder changes
    if (currentOrder && currentOrder.created_at) {
      const createdMs = new Date(currentOrder.created_at).getTime();
      const diffSecs = Math.floor((new Date().getTime() - createdMs) / 1000);
      const remaining = 10800 - diffSecs;
      setTimeLeft(remaining > 0 ? remaining : 0);
    }

    if (currentOrder && currentOrder.status?.toUpperCase() !== 'PAID' && currentOrder.status !== 'expired') {
      timer = setInterval(() => {
        const createdMs = new Date(currentOrder.created_at).getTime();
        const diffSecs = Math.floor((new Date().getTime() - createdMs) / 1000);
        const remaining = 10800 - diffSecs;
        if (remaining <= 0) {
          setTimeLeft(0);
          clearInterval(timer);
          if (currentOrder.status === 'pending') {
             setCurrentOrder(prev => prev ? {...prev, status: 'expired'} : prev);
          }
        } else {
          setTimeLeft(remaining);
        }
      }, 1000);
    } else if (!currentOrder) {
      timer = setInterval(() => {
        setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    } else if (currentOrder?.status === 'expired') {
      setTimeLeft(0);
    }
    return () => { if (timer) clearInterval(timer); };
  }, [currentOrder]);

  // Check admin status
  useEffect(() => {
    // If isAdminProp is provided, we use it directly
    if (isAdminProp !== undefined) {
      console.log("[DEBUG] Using isAdmin from prop:", isAdminProp);
      setIsAdmin(isAdminProp);
      return;
    }

    const checkAdmin = async () => {
      console.log("[DEBUG] checkAdmin starting for userId:", userId);
      if (!userId) {
        console.warn("[DEBUG] checkAdmin: No userId provided");
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('users')
          .select('is_admin, role')
          .eq('id', userId)
          .maybeSingle(); // Use maybeSingle to avoid error if not found
          
        if (error) {
          console.error("[DEBUG] checkAdmin error:", error);
          return;
        }
        
        if (data) {
          const isAdm = data.is_admin === true || data.is_admin === 1 || data.role === 'admin';
          console.log("[DEBUG] checkAdmin data found:", { data, isAdm });
          setIsAdmin(isAdm);
        } else {
          console.log("[DEBUG] checkAdmin: No user record found in 'users' table for ID:", userId);
        }
      } catch (err) {
        console.error("[DEBUG] checkAdmin unexpected error:", err);
      }
    };
    checkAdmin();
  }, [userId]);

  useEffect(() => {
    (async () => {
      const urlOrderId = searchParams.get('orderId');
      const effectiveOrderId = existingOrderId || urlOrderId;

      if (!effectiveOrderId) {
        hasInitialized.current = true;
        return;
      }

      // If we already have the same order loaded, don't re-fetch
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
          console.log("[DEBUG] Resuming by pakasir_order_id:", effectiveOrderId);
          query = query.eq('pakasir_order_id', effectiveOrderId);
        }

        const { data: order, error } = await query.maybeSingle();
        if (error) throw error;
        
        if (order) {
          console.log("[DEBUG] Resuming order found:", order.id);
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
        console.error("[DEBUG] fetchOrder error:", err);
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

  // --- SINGLE ROBUST MONITORING & ACTION EFFECT ---
  useEffect(() => {
    const orderId = currentOrder?.id;
    if (!orderId) return;

    const isPaid = PAID_STATUSES.includes(currentOrder.status?.toUpperCase() || '');
    
    // IF ALREADY PAID: Trigger success actions (if not done yet)
    if (isPaid) {
      if (successTriggered.current) return;
      successTriggered.current = true;

      console.log("[DEBUG] Success detected! Triggering actions for:", orderId);

      // Perform background tasks
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
        isDatabase ? 'https://mail.google.com/mail/u/0/#search/RuangSinggah' : '/my-bookings'
      ).catch(err => console.error("Failed to create payment notification:", err));
      
      if (['rent', 'kost_booking', 'tagihan_ekstra', 'property', 'kost', 'perpanjangan_sewa'].includes(productType)) {
          syncResidentStatus(orderId).catch(e => console.error("Sync error:", e));
      }

      if (productType === 'survey') {
           syncSurveyRequest(orderId).catch(e => console.error("Sync error:", e));
      }
      return;
    }

    // IF NOT PAID: Start monitoring
    console.log(`[DEBUG] MONITORING START for ID: ${orderId}`);

    // 1. Real-time subscription
    const channel = supabase
      .channel(`monitor-${orderId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions', filter: `id=eq.${orderId}` },
        (payload) => {
          const newStatus = payload.new.status?.toUpperCase() || '';
          console.log(`[DEBUG] REAL-TIME UPDATE for ${orderId}:`, payload.new.status);
          if (PAID_STATUSES.includes(newStatus)) {
            setCurrentOrder(payload.new as Transaction);
          }
        }
      )
      .subscribe();

    // 2. Polling fallback (Fast 3s)
    const pollInterval = setInterval(async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', orderId)
        .single();

      if (data) {
        const dbStatus = data.status?.toUpperCase() || '';
        if (PAID_STATUSES.includes(dbStatus)) {
           console.log("[DEBUG] Polling match! Updating state...");
           setCurrentOrder(data as Transaction);
        }
      }
    }, 3000);

    return () => {
      console.log(`[DEBUG] MONITORING CLEANUP for ID: ${orderId}`);
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

  // Load Midtrans Snap Script dynamically based on environment
  useEffect(() => {
    if (!config) return;

    const isProd = config.midtransEnv === 'PRODUCTION';
    const snapSrc = isProd 
      ? "https://app.midtrans.com/snap/snap.js" 
      : "https://app.sandbox.midtrans.com/snap/snap.js";
    
    const clientKey = config.midtransClientKey; 
    
    // Cleanup old scripts if any
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
      console.log(`[DEBUG] handlePay triggered with ${selectedGateway} for:`, productType);
      
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

      if (result.directPayment) {
        console.log("[DEBUG] Received Direct Payment Data");
        setDirectData(result.directPayment);
        if (method) setSelectedMethod(method);
        
        if (result.redirect_url) setRedirectUrl(result.redirect_url);
        setShowCheckout(true);
        setIsProcessing(false);
        
        if (result.order) {
            console.log("[DEBUG] Setting currentOrder from response:", result.order.id);
            setCurrentOrder(result.order);
        }

        if (result.orderId) {
          setSearchParams({ orderId: result.orderId });
        }

        // [AUTO-REDIRECT] For E-Wallets with Deeplinks (GoPay, ShopeePay)
        const deeplink = result.directPayment?.actions?.find((a: any) => 
            a.name === 'deeplink-redirect' || a.name === 'shopeepay-deeplink' || a.url?.includes('deeplink')
        )?.url;

        if (deeplink && (method === 'gopay' || method === 'shopeepay')) {
            console.log("[DEBUG] Auto-redirecting to Deeplink:", deeplink);
            window.location.href = deeplink;
            return;
        }
      } else if (selectedGateway === 'MIDTRANS' && result.token) {
        console.log("[DEBUG] Received Snap Token");
        if (result.redirect_url) setRedirectUrl(result.redirect_url);
        
        if (result.order) {
            console.log("[DEBUG] Setting currentOrder from Snap response:", result.order.id);
            setCurrentOrder(result.order);
        }

        // [AUTO-REDIRECT] For DANA (Special requirement for direct redirect)
        if (method === 'dana' && result.redirect_url) {
            console.log("[DEBUG] Auto-redirecting to DANA Redirect URL:", result.redirect_url);
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
        console.log("[DEBUG] Redirecting to Checkout URL:", targetUrl);
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
    
    // Primary method
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        setShowCopied(true);
        setTimeout(() => setShowCopied(false), 2000);
      }).catch(err => {
        console.error("Clipboard API failed, using fallback", err);
        fallbackCopyTextToClipboard(text);
      });
    } else {
      fallbackCopyTextToClipboard(text);
    }
  };

  const fallbackCopyTextToClipboard = (text: string) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";  // avoid scrolling to bottom
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
        "Buka aplikasi e-wallet Anda (GoPay, OVO, DANA, LinkAja, dll).",
        "Pilih menu 'Scan' atau 'Bayar'.",
        "Arahkan kamera ke QR Code yang tertera atau gunakan file dari galeri.",
        "Periksa nominal pembayaran & konfirmasi transaksi.",
        "Masukkan PIN Anda & pembayaran selesai."
      ];
    }
    
    if (method === 'bca_va') {
      return [
        "Buka m-BCA, pilih menu 'm-Transfer'.",
        "Pilih 'BCA Virtual Account'.",
        "Masukkan nomor Virtual Account & klik 'Send'.",
        "Pastikan nominal sesuai, lalu masukkan PIN m-BCA.",
        "Pembayaran berhasil."
      ];
    }

    if (method === 'bni_va') {
      return [
        "Buka BNI Mobile Banking, pilih menu 'Transfer'.",
        "Pilih 'Virtual Account Billing'.",
        "Pilih rekening debet & masukkan nomor Virtual Account.",
        "Konfirmasi transaksi & masukkan Password Transaksi.",
        "Pembayaran berhasil."
      ];
    }

    if (method === 'bri_va') {
      return [
        "Buka BRImo, pilih menu 'Pembayaran'.",
        "Pilih menu 'BRIVA'.",
        "Masukkan nomor Virtual Account.",
        "Konfirmasi transaksi, masukkan nominal & PIN BRImo.",
        "Pembayaran berhasil."
      ];
    }

    if (method === 'mandiri_va') {
      return [
        "Buka Livin' by Mandiri, pilih menu 'Bayar'.",
        "Cari penyedia jasa (Biller) atau masukkan kode perusahaan.",
        "Masukkan nomor Virtual Account.",
        "Konfirmasi nominal & masukkan PIN Livin'.",
        "Pembayaran berhasil."
      ];
    }

    if (method === 'bsi_va') {
      return [
        "Buka BSI Mobile, pilih menu 'Pembayaran'.",
        "Pilih 'Virtual Account'.",
        "Masukkan nomor Virtual Account BSI Anda.",
        "Konfirmasi data transaksi & masukkan PIN BSI Mobile.",
        "Pembayaran berhasil."
      ];
    }

    if (method === 'cimb_va') {
      return [
        "Buka OCTO Mobile, pilih menu 'Transfer'.",
        "Pilih 'Transfer ke Rekening CIMB Niaga Lain'.",
        "Masukkan nomor Virtual Account CIMB Niaga.",
        "Masukkan nominal & konfirmasi dengan PIN OCTO.",
        "Pembayaran berhasil."
      ];
    }

    if (method === 'permata_va') {
      return [
        "Masukkan nomor Virtual Account sebagai rekening tujuan.",
        "Masukkan nominal yang sesuai dengan tagihan.",
        "Konfirmasi & selesaikan transaksi."
      ];
    }

    if (method === 'alfamart' || method === 'indomaret') {
      const store = method === 'alfamart' ? 'Alfamart' : 'Indomaret';
      return [
        `Kunjungi gerai ${store} terdekat.`,
        "Tunjukkan Kode Pembayaran kepada Kasir.",
        "Bayar sesuai jumlah tagihan yang disebutkan Kasir.",
        "Simpan struk pembayaran sebagai bukti transaksi.",
        "Status pembayaran akan terverifikasi secara otomatis."
      ];
    }

    return [
      "Buka aplikasi perbankan atau e-wallet Anda.",
      "Pilih menu pembayaran yang sesuai.",
      "Masukkan detail nomor bayar yang tertera.",
      "Pastikan nominal sesuai & konfirmasi transaksi.",
      "Pembayaran akan terdeteksi otomatis oleh sistem."
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
      alert("Gagal mengunduh QRIS. Silakan screenshot layar saja.");
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
      
      // We don't call onPaymentSuccess directly anymore. 
      // The Real-time monitor in the useEffect will detect the DB update to 'PAID'
      // and automatically switch the UI to the Success screen.
      console.log("[DEBUG] Simulation trigger sent. Waiting for real-time monitor...");
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
      <div className="absolute inset-0 bg-gray-900/90 backdrop-blur-lg" onClick={onCancel}></div>

      <div className={`relative bg-white w-full h-full sm:max-w-3xl sm:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-10 duration-500 ${showCheckout ? 'sm:h-auto sm:max-h-[90vh]' : 'sm:h-auto max-h-[95vh]'}`}>
        
        {/* Loading Overlay */}
        {isProcessing && (
          <div className="absolute inset-0 z-[200] bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center p-10 text-center animate-in fade-in duration-300">
             <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mb-6"></div>
             <h3 className="text-sm font-black uppercase tracking-widest text-gray-900">Menyiapkan Pembayaran...</h3>
             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Mohon tunggu sebentar.</p>
          </div>
        )}

        {/* Header Summary */}
        <div className="bg-gray-900 p-6 sm:p-8 text-white flex-shrink-0 relative overflow-hidden">
          {/* Subtle Background Pattern */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-orange-500 font-black text-xl">RS</span>
                  <span className="font-bold text-[10px] uppercase tracking-widest text-gray-400">Checkout Gateway</span>
                </div>
                <p className="text-xs text-gray-500">Order ID: <span className="text-gray-300 font-bold">#{currentOrder?.id?.split('-').pop()?.toUpperCase() || orderId}</span></p>
              </div>
              <div className="flex items-center gap-3">
                {showCheckout && (
                  <button 
                    onClick={() => { setShowCheckout(false); setSelectedMethod(null); setDirectData(null); }}
                    className="p-2.5 bg-white/5 hover:bg-white/10 rounded-full transition-colors flex items-center gap-2 text-gray-400 border border-white/5"
                  >
                    <span className="text-[9px] font-black uppercase tracking-tight px-1">Ganti Metode</span>
                  </button>
                )}
                <button onClick={onCancel} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-full transition-colors flex items-center justify-center border border-white/5">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            <div className="flex justify-between items-end border-t border-white/5 pt-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Total Tagihan</p>
                  <button 
                    onClick={() => setShowDetails(!showDetails)}
                    className="text-[9px] font-black uppercase tracking-widest text-orange-500 hover:text-orange-400 flex items-center gap-1 transition-colors"
                  >
                    {showDetails ? 'Sembunyikan Detail ↑' : 'Lihat Rincian ↓'}
                  </button>
                </div>
                <p className="text-4xl font-black text-orange-500 tracking-tighter">{FORMAT_CURRENCY(amount)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Batas Waktu</p>
                <p className={`text-lg font-mono font-black ${timeLeft < 300 ? 'text-red-500 animate-pulse' : 'text-white'}`}>{formatTime(timeLeft)}</p>
              </div>
            </div>

            {/* Expandable Details Section */}
            {showDetails && (
              <div className="mt-6 pt-6 border-t border-white/5 space-y-3 animate-in slide-in-from-top-4 duration-300">
                {(() => {
                  const items = metadata?.item_details || [
                    { name: metadata?.billName || 'Total Pembayaran', price: amount }
                  ];
                  return items.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <span className="text-gray-400 font-medium">{item.name || item.bill_name || 'Item'}</span>
                      <span className="text-gray-200 font-bold">{FORMAT_CURRENCY(item.price || item.amount || 0)}</span>
                    </div>
                  ));
                })()}
                <div className="pt-3 border-t border-white/5 flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-black uppercase">Pajak & Layanan</span>
                  <span className="text-green-500 font-bold">TERMASUK</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className={`flex-grow overflow-y-auto bg-white flex flex-col p-6 sm:p-10`}>
          {currentOrder?.status === 'expired' ? (
            <div className="flex flex-col items-center justify-center text-center p-8 space-y-4 my-auto">
               <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-500 mb-2">
                 <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
               </div>
               <h3 className="text-xl font-black text-gray-900 uppercase tracking-widest">Waktu Habis</h3>
               <p className="text-sm font-medium text-gray-500 max-w-sm">Sesi pembayaran telah kadaluarsa karena melewati batas waktu 3 jam. Silakan ulangi pemesanan dari awal.</p>
               <button onClick={onCancel} className="mt-8 bg-gray-900 text-white px-8 py-4 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-orange-500 transition-colors">Tutup</button>
            </div>
          ) : PAID_STATUSES.includes(currentOrder?.status?.toUpperCase() || '') ? (
            <div className="flex flex-col items-center justify-center text-center p-8 space-y-6 my-auto animate-in zoom-in-95 duration-500">
               <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center text-green-500 mb-2 shadow-inner">
                 <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
               </div>
               
               <div className="space-y-2">
                 <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Pembayaran Berhasil!</h2>
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-green-600">Transaksi Terverifikasi • #{currentOrder?.id?.slice(0,8)}</p>
               </div>

               <div className="w-full max-w-sm bg-gray-50 rounded-[2rem] p-6 border border-gray-100 space-y-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">Produk</span>
                    <span className="text-gray-900 font-black">{productType === 'database' ? 'Database Kost' : productType === 'survey' ? 'Jasa Survey' : 'Sewa Kost'}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">Nominal</span>
                    <span className="text-orange-600 font-black">{FORMAT_CURRENCY(amount)}</span>
                  </div>
                  <div className="pt-4 border-t border-gray-200 flex flex-col gap-2">
                    <p className="text-[10px] font-medium text-gray-500 italic">Konfirmasi dan link akses telah dikirimkan ke email Anda.</p>
                  </div>
               </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
                  <button 
                   onClick={() => onPaymentSuccess(currentOrder?.id)} 
                   className="flex-grow bg-gray-900 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-orange-500 transition-all shadow-xl shadow-gray-200"
                  >
                   {productType === 'survey' ? 'Lihat di Kost Saya' : 'Lanjutkan ke Pesanan'}
                  </button>
                 {productType === 'survey' && (
                   <a 
                    href="https://wa.me/6285156634283" 
                    target="_blank" 
                    className="flex-grow bg-green-500 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-green-600 transition-all text-center shadow-xl shadow-green-100"
                   >
                    Hubungi Admin
                   </a>
                 )}
               </div>
            </div>
          ) : !showCheckout ? (
            <div className="space-y-8">
              <div className="text-center sm:text-left">
                <h2 className="text-xl font-black uppercase text-gray-900 tracking-tight">Pilih Metode Pembayaran</h2>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-1">100% Aman & Terverifikasi</p>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-[10px] font-bold uppercase tracking-widest text-center">
                  ⚠️ {error}
                </div>
              )}

              <div className="w-full space-y-8">
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
                      <div key={cat.id} className="space-y-4">
                        {/* Section Header (No Icon, Always Open) */}
                        <div className="flex items-center gap-3 px-2">
                           <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{cat.name}</span>
                           <div className="flex-grow h-[1px] bg-gray-100"></div>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                          {methods.map((method) => {
                            const isQRIS = method.code === 'qris';
                            return (
                              <button 
                                key={method.code}
                                onClick={() => handlePay(method.code)}
                                disabled={isProcessing}
                                className={`group flex items-center gap-5 p-5 rounded-[2.5rem] border-2 text-left transition-all relative overflow-hidden ${
                                  selectedMethod === method.code 
                                  ? 'border-orange-500 bg-orange-50/50 shadow-xl scale-[1.02]' 
                                  : 'border-gray-100 bg-white hover:border-orange-200 hover:shadow-lg'
                                } ${isProcessing ? 'opacity-50' : ''}`}
                              >
                                <div className={`w-12 h-12 ${method.color} rounded-2xl flex items-center justify-center p-2 shadow-sm border border-gray-50 shrink-0`}>
                                  {method.iconUrl && !imageErrors[method.code] ? (
                                    <img 
                                        src={method.iconUrl} 
                                        alt={method.name} 
                                        className="w-full h-full object-contain" 
                                        onError={() => setImageErrors(prev => ({ ...prev, [method.code]: true }))}
                                    />
                                  ) : (
                                    <span className="text-2xl">{method.icon}</span>
                                  )}
                                </div>
                                <div className="flex-grow">
                                  <p className="font-black text-[11px] uppercase tracking-widest text-gray-900">{method.name}</p>
                                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter mt-0.5">
                                    {isQRIS ? 'Otomatis Terdeteksi • Semua Bank & E-Wallet' : 'Konfirmasi Instan • Aman'}
                                  </p>
                                </div>
                                <div className="text-gray-300 group-hover:text-orange-500">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                                </div>
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
            <div className="w-full flex flex-col items-center animate-in zoom-in-95 duration-300">
               
                {/* Unified Native UI (For White-Label Midtrans or Pakasir) */}
                {directData ? (
                  <div className="w-full flex flex-col items-center">
                    {selectedMethod === 'qris' || selectedMethod === 'gopay' || selectedMethod === 'ovo' || selectedMethod === 'dana' || selectedMethod === 'shopeepay' || (directData.payment_type === 'qris') ? (
                      <div className="space-y-8 w-full max-w-sm text-center">
                        <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl border border-gray-100 flex flex-col items-center">
                            {(() => {
                              // 1. Get raw string for QR (Robust fallbacks for Midtrans/Pakasir)
                              const qrString = directData?.qr_string || 
                                               directData?.payment?.data || 
                                               directData?.qr_data || 
                                               directData?.payment_number || 
                                               directData?.data ||
                                               (directData?.actions?.find((a: any) => a.name === 'generate-qr-code')?.url);
                              
                              const qrAction = directData?.actions?.find((a: any) => a.name === 'generate-qr-code');
                              const qrUrl = qrAction?.url;
                              
                              if (!qrString && !qrUrl && !isProcessing) {
                                return <div className="w-full aspect-square bg-gray-50 rounded-2xl flex items-center justify-center text-[10px] font-bold text-gray-400 uppercase tracking-widest p-10 text-center">Data Pembayaran Belum Tersedia</div>;
                              }

                              const finalSrc = qrString 
                                ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrString)}&margin=10`
                                : qrUrl;

                              return (
                                <img 
                                    src={finalSrc} 
                                    alt="QRIS Code" 
                                    className="w-full h-full max-w-[250px] aspect-square object-contain" 
                                />
                              );
                            })()}
                            <div className="mt-4 flex items-center gap-2">
                                <span className="font-black text-xs uppercase tracking-widest text-gray-400">Scan via</span>
                                <div className="flex gap-2 text-xl">📱 💳</div>
                            </div>
                        </div>

                        {/* Deep Link / Open App Button */}
                        {(() => {
                            const deeplink = directData?.actions?.find((a: any) => a.name === 'deeplink-redirect' || a.name === 'shopeepay-deeplink' || a.url?.includes('deeplink'))?.url;
                            if (deeplink) {
                                return (
                                    <div className="space-y-4 w-full">
                                        <a 
                                            href={deeplink}
                                            className="block w-full py-5 bg-blue-600 text-white rounded-3xl font-black uppercase tracking-widest text-center shadow-xl shadow-blue-200 active:scale-95 transition-all animate-bounce"
                                        >
                                            Buka Aplikasi {selectedMethod?.toUpperCase()}
                                        </a>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase">Klik tombol di atas untuk bayar langsung di HP Anda</p>
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
                                className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-4 rounded-3xl text-xs font-black uppercase tracking-widest hover:bg-gray-200 transition-all"
                           >
                                📥 Download QR Code
                           </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-10 w-full max-w-sm text-center py-6">
                        <div className="space-y-6">
                            <h2 className="text-xl font-black uppercase text-gray-900 tracking-tight">Instruksi Pembayaran</h2>
                            <div className="bg-gray-50 p-8 rounded-[3rem] border border-gray-100 space-y-6">
                                {(() => {
                                    const midtransVa = directData?.va_numbers?.[0]?.va_number;
                                    const mandiriVa = directData?.bill_key;
                                    const permataVa = directData?.permata_va_number;
                                    const retailCode = directData?.payment_code;
                                    
                                    // [ROBUST] Multi-gateway & Multi-bank Fallback logic
                                    // Priorities: 1. Server-side flat field, 2. Direct paths, 3. Deep fallbacks
                                    const codeToCopy = (currentOrder?.metadata as any)?.payment_number || 
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
                                    
                                    return (
                                        <div className="flex flex-col items-center gap-6 w-full">
                                            <div className="flex flex-col items-center gap-2">
                                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
                                                    {availableMethods.find(m => m.code === selectedMethod)?.name || 'Nomor Virtual Account'}
                                                </span>
                                                <p className="text-3xl font-black text-gray-900 tracking-wider font-mono">
                                                    {codeToCopy || '---'}
                                                </p>
                                                {(directData?.biller_code || directData?.bill_key) && (
                                                    <p className="text-[10px] font-bold text-gray-500 uppercase">
                                                        {directData?.biller_code ? `Kode Biller: ${directData.biller_code}` : ''}
                                                        {directData?.biller_code && directData?.bill_key ? ' | ' : ''}
                                                        {directData?.bill_key ? `Bill Key: ${directData.bill_key}` : ''}
                                                    </p>
                                                )}
                                            </div>
                                            
                                            {codeToCopy && (
                                                <button 
                                                    onClick={() => copyToClipboard(codeToCopy)} 
                                                    className={`px-8 py-3 bg-white text-[10px] font-black uppercase tracking-widest rounded-full border transition-all active:scale-95 shadow-sm ${
                                                        showCopied 
                                                        ? 'border-green-500 text-green-500 bg-green-50' 
                                                        : 'border-gray-200 text-gray-900 hover:border-orange-500 hover:text-orange-500'
                                                    }`}
                                                >
                                                    {showCopied ? '✅ Berhasil Disalin!' : 'Salin Kode Bayar'}
                                                </button>
                                            )}
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                         <div className="space-y-6 text-left">
                            <h2 className="text-xl font-black uppercase text-gray-900 tracking-tight text-center">TUTORIAL PEMBAYARAN</h2>
                            <ul className="text-[10px] font-bold uppercase tracking-widest text-gray-400 space-y-3 list-none bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
                                {getTutorial().map((step, idx) => (
                                    <li key={idx} className="flex gap-3">
                                        <span className="flex-shrink-0 w-4 h-4 bg-white rounded-full flex items-center justify-center text-[8px] text-gray-600 font-black border border-gray-200">{idx + 1}</span>
                                        <span className="leading-tight">{step}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full flex flex-col items-center justify-center py-20 px-6 text-center space-y-6">
                     <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center text-4xl animate-bounce">
                        💳
                     </div>
                     <div className="space-y-2">
                        <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Lanjutkan Pembayaran</h3>
                        <p className="text-xs font-medium text-gray-500 max-w-[280px]">Klik tombol di bawah untuk menyelesaikan pembayaran via portal resmi Midtrans yang aman.</p>
                     </div>
                     <button 
                        onClick={() => handlePay(selectedMethod || undefined)}
                        className="w-full max-w-[280px] bg-gray-900 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest shadow-xl shadow-gray-200 active:scale-95 transition-all"
                     >
                        Bayar Sekarang
                     </button>
                     <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Otomatis Terverifikasi • Aman & Terenkripsi</p>
                  </div>
                )}

               {/* Universal Status & Admin Controls */}
               <div className="w-full max-w-sm mt-8 space-y-4">
                  <div className="px-6 py-5 bg-orange-50 rounded-[2rem] border border-orange-100 flex flex-col gap-4">
                    <div className="flex items-center gap-3 w-full">
                      <div className={`w-2 h-2 rounded-full ${currentOrder?.status?.toUpperCase() === 'PAID' ? 'bg-green-500' : 'bg-orange-500 animate-pulse'}`}></div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-orange-600 flex-grow">
                        {currentOrder?.status?.toUpperCase() === 'PAID' ? 'Pembayaran Terverifikasi' : 'Menunggu pembayaran terdeteksi sistem...'}
                      </span>
                      {currentOrder?.status?.toUpperCase() !== 'PAID' && (
                        <button 
                          onClick={async () => {
                              setIsProcessing(true);
                              try {
                                  const { data, error } = await supabase.from('transactions').select('*').eq('id', currentOrder?.id).single();
                                  if (data && PAID_STATUSES.includes(data.status?.toUpperCase() || '')) {
                                      setCurrentOrder(data as Transaction);
                                  } else {
                                      alert("Pembayaran belum terdeteksi. Pastikan Anda sudah menyelesaikan transaksi di aplikasi.");
                                  }
                              } catch (e) {
                                  console.error(e);
                              } finally {
                                  setIsProcessing(false);
                              }
                          }}
                          className="text-[9px] font-black text-orange-500 underline decoration-2 underline-offset-4 uppercase tracking-widest hover:text-orange-600 transition-colors"
                        >
                          Cek Status
                        </button>
                      )}
                    </div>

                    {currentOrder?.status?.toUpperCase() === 'PAID' && (
                      <div className="pt-4 border-t border-orange-200/50 space-y-3">
                          <div className="flex items-center justify-between">
                              <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Notifikasi Email</span>
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                  currentOrder.metadata?.email_sent_status === 'SUCCESS' ? 'bg-green-500 text-white' :
                                  currentOrder.metadata?.email_sent_status === 'FAILED' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white animate-pulse'
                              }`}>
                                  {currentOrder.metadata?.email_sent_status || 'MEMPROSES...'}
                              </span>
                          </div>
                          {currentOrder.metadata?.email_error && (
                              <div className="bg-red-100/50 p-3 rounded-xl border border-red-200">
                                  <p className="text-[10px] font-medium text-red-700 leading-tight font-mono break-all">{currentOrder.metadata.email_error}</p>
                              </div>
                          )}
                      </div>
                    )}
                  </div>


               </div>

            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className={`flex-shrink-0 p-6 sm:p-10 border-t border-gray-50 bg-gray-50/50 ${showCheckout ? 'py-4' : ''}`}>
          <div className="flex flex-col items-center gap-3">
            <p className="text-center text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                {showCheckout 
                ? 'Selesaikan pembayaran pada panel di atas' 
                : `Pembayaran aman & terverifikasi oleh ${selectedGateway === 'MIDTRANS' ? 'Midtrans' : 'Pakasir'}`
                }
            </p>
            
            {/* COMPARISON MODE (Admin/Sandbox Only) */}
            {redirectUrl && showCheckout && (
                <a 
                    href={redirectUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-[9px] font-black uppercase tracking-widest text-gray-500 rounded-full transition-all border border-gray-200"
                >
                    🔍 Bandingkan dengan Snap Resmi (Mode Audit)
                </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentGateway;
