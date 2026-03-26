
import React, { useState, useEffect } from 'react';
import { FORMAT_CURRENCY } from '../constants';
import { supabase } from '../supabase';
import { notificationService } from '../notificationService';
import { Transaction } from '../types';

interface PaymentGatewayProps {
  amount: number;
  orderId: string;
  productId: string;
  productType: 'database' | 'kost_booking' | 'survey'; // Support for different products
  userId: string;
  metadata?: any;
  existingOrderId?: string;
  onPaymentSuccess: () => void;
  onCancel: () => void;
}

const PaymentGateway: React.FC<PaymentGatewayProps> = ({ 
  amount, 
  orderId, 
  productId, 
  productType, 
  userId, 
  metadata = {},
  existingOrderId,
  onPaymentSuccess, 
  onCancel 
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10800);
  const [currentOrder, setCurrentOrder] = useState<Transaction | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [directData, setDirectData] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const PAYMENT_METHODS = [
    { code: 'qris', name: 'QRIS', icon: '📱', color: 'bg-green-50' },
    { code: 'bri_va', name: 'BRI Virtual Account', icon: '🏦', color: 'bg-blue-50' },
    { code: 'bni_va', name: 'BNI Virtual Account', icon: '🏦', color: 'bg-orange-50' },
    { code: 'mandiri_va', name: 'Mandiri Virtual Account', icon: '🏦', color: 'bg-yellow-50' },
    { code: 'permata_va', name: 'Permata Virtual Account', icon: '🏦', color: 'bg-red-50' },
    { code: 'atm_bersama', name: 'ATM Bersama', icon: '💳', color: 'bg-gray-100' },
    { code: 'cimb_va', name: 'CIMB Virtual Account', icon: '🏦', color: 'bg-red-50' },
    { code: 'maybank_va', name: 'Maybank Virtual Account', icon: '🏦', color: 'bg-yellow-50' },
    { code: 'danamon_va', name: 'Danamon Virtual Account', icon: '🏦', color: 'bg-orange-50' },
    { code: 'bsi_va', name: 'BSI Virtual Account', icon: '🏦', color: 'bg-green-50' },
  ];

  useEffect(() => {
    let timer: any;
    
    // Initial calculation immediately when currentOrder changes
    if (currentOrder && currentOrder.created_at) {
      const createdMs = new Date(currentOrder.created_at).getTime();
      const diffSecs = Math.floor((new Date().getTime() - createdMs) / 1000);
      const remaining = 10800 - diffSecs;
      setTimeLeft(remaining > 0 ? remaining : 0);
    }

    if (currentOrder && currentOrder.status !== 'paid' && currentOrder.status !== 'expired') {
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
    const checkAdmin = async () => {
      console.log("[DEBUG] checkAdmin starting for userId:", userId);
      if (!userId) return;
      
      const { data, error } = await supabase
        .from('users')
        .select('is_admin, role')
        .eq('id', userId)
        .single();
        
      if (error) {
        console.error("[DEBUG] checkAdmin error:", error);
      }
      
      if (data) {
        const isAdm = data.is_admin || data.role === 'admin';
        console.log("[DEBUG] checkAdmin data found:", { data, isAdm });
        setIsAdmin(isAdm);
      } else {
        console.log("[DEBUG] checkAdmin no data found for userId:", userId);
      }
    };
    checkAdmin();
  }, [userId]);

  // Auto-initialize order on mount
  useEffect(() => {
    if (existingOrderId && !currentOrder) {
      const fetchExisting = async () => {
        setIsProcessing(true);
        try {
          const { data, error: fetchErr } = await supabase
            .from('transactions')
            .select('*')
            .eq('id', existingOrderId)
            .single();
          if (fetchErr) throw fetchErr;
          const order = data as Transaction;
          setCurrentOrder(order);

          // Restore payment method state so user doesn't have to re-select
          const savedMethod = (order as any).payment_method || (order as any).metadata?.selected_method;
          if (savedMethod) {
            setSelectedMethod(savedMethod);
            // If the payment was already created via Pakasir, restore the direct data from metadata
            const savedDirectData = (order as any).metadata?.pakasir_response;
            if (savedDirectData) {
              setDirectData(savedDirectData);
              setShowCheckout(true);
            }
            // If no direct data but method was set, we re-call the backend to re-create Pakasir payment
          }
        } catch (err: any) {
          setError('Gagal memuat detail tagihan: ' + err.message);
        } finally {
          setIsProcessing(false);
        }
      };
      fetchExisting();
    } else if (!existingOrderId && !currentOrder && !isProcessing && !error) {
       handlePay();
    }
  }, [existingOrderId]);

  // Poll for payment status
  useEffect(() => {
    if (!currentOrder || currentOrder.status === 'paid') return;

    const pollInterval = setInterval(async () => {
      const { data } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', currentOrder.id)
        .single();

      if (data && data.status === 'paid') {
        clearInterval(pollInterval);
        setCurrentOrder(data as Transaction);
        
        const m = metadata as any;
        const isDatabase = productType === 'database' || productType === 'available_database';
        
        notificationService.createNotification({
          user_id: userId,
          title: isDatabase ? 'Database Terkirim!' : 'Pembayaran Berhasil!',
          message: isDatabase 
            ? `Database ${m.name || m.area || 'Kost'} telah dikirim ke email Anda. Silakan cek Inbox atau folder Spam.`
            : `Pembayaran sewa ${m.kostName || 'Kost'} senilai Rp ${amount.toLocaleString('id-ID')} telah berhasil diverifikasi.`,
          type: 'payment',
          link: isDatabase 
            ? 'https://mail.google.com/mail/u/0/#search/RuangSinggah' 
            : '/my-bookings'
        }).catch(err => console.error("Failed to create payment notification:", err));

        onPaymentSuccess();
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [currentOrder, onPaymentSuccess]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handlePay = async (method?: string) => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('https://createpakasirpayment-hzxlewhsuq-uc.a.run.app', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          productId, 
          productType, 
          userId, 
          metadata,
          method: method, // Send the selected method
          existingOrderId
        })
      });

      const result = await response.json();
      console.log("[DEBUG] createPakasirPayment Result:", result);
      
      if (!response.ok) {
        if (response.status === 409) {
          setError(result.message);
          setIsProcessing(false);
          return;
        }
        throw new Error(result.message || 'Gagal membuat pembayaran');
      }

      setCurrentOrder(result.order);
      setDirectData(result.directPayment);
      
      // If a method was selected but the API failed, show the error
      if (method && result.apiStatus !== 'success') {
        const errMsg = result.order?.metadata?.pakasir_error || result.message || 'Metode pembayaran ini sedang tidak tersedia. Silakan coba metode lain.';
        console.error("[DEBUG] Pakasir API Error:", errMsg);
        setError(errMsg);
        setSelectedMethod(null);
        setShowCheckout(false);
        return;
      }

      console.log("[DEBUG] Payment successful, showing checkout:", method ? 'yes' : 'no');
      if (method) setShowCheckout(true);
    } catch (err: any) {
      console.error("Payment Error:", err);
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Berhasil disalin!');
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
    if (!currentOrder) return;
    setIsProcessing(true);
    console.log("[DEBUG] Simulating payment via backend for order:", currentOrder.id);
    try {
      const response = await fetch('https://simulatepaymentsuccess-hzxlewhsuq-uc.a.run.app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          orderId: currentOrder.id,
          adminUserId: userId 
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Gagal simulasi');
      
      console.log("[DEBUG] Backend Simulation Success:", result);
      alert("Simulasi BERHASIL! Database terupdate & Email Konfirmasi telah dipicu (Cek Console/Log jika email belum sampai).");
      onPaymentSuccess();
    } catch (err: any) {
      console.error("[DEBUG] Simulation error:", err);
      alert("Simulasi Gagal: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const isSandbox = JSON.stringify(directData || {}).toUpperCase().includes('SANDBOX');
  
  // DEBUG LOGS
  useEffect(() => {
    if (directData || isAdmin) {
      console.log("[DEBUG] PaymentGateway State:", { 
        isAdmin, 
        isSandbox, 
        hasCurrentOrder: !!currentOrder,
        orderStatus: currentOrder?.status,
        directDataSnippet: JSON.stringify(directData || {}).substring(0, 100)
      });
    }
  }, [isAdmin, isSandbox, directData, currentOrder]);

  const showAdminSim = isAdmin && (isSandbox || true) && currentOrder?.status === 'pending'; // Force show for admin during debug

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-0 sm:p-4 overflow-hidden">
      <div className="absolute inset-0 bg-gray-900/90 backdrop-blur-lg" onClick={onCancel}></div>

      <div className={`relative bg-white w-full h-full sm:max-w-3xl sm:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-10 duration-500 ${showCheckout ? 'sm:h-auto' : 'sm:h-auto max-h-[95vh]'}`}>
        
        {/* Loading Overlay */}
        {isProcessing && (
          <div className="absolute inset-0 z-[200] bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center p-10 text-center animate-in fade-in duration-300">
             <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mb-6"></div>
             <h3 className="text-sm font-black uppercase tracking-widest text-gray-900">Menyiapkan Pembayaran...</h3>
             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Mohon tunggu sebentar.</p>
          </div>
        )}

        {/* Header Summary */}
        <div className="bg-gray-900 p-6 sm:p-8 text-white flex-shrink-0">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-orange-500 font-black text-xl">RS</span>
                <span className="font-bold text-[10px] uppercase tracking-widest text-gray-400">Checkout Gateway</span>
              </div>
              <p className="text-xs text-gray-500">Order ID: <span className="text-gray-300 font-bold">#{orderId}</span></p>
            </div>
            <div className="flex items-center gap-3">
              {showCheckout && (
                <button 
                  onClick={() => { setShowCheckout(false); setSelectedMethod(null); setDirectData(null); }}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors flex items-center gap-2 text-gray-400"
                >
                  <span className="text-[10px] font-bold uppercase tracking-tighter">Ganti Bank</span>
                </button>
              )}
              <button onClick={onCancel} className="p-2 hover:bg-white/10 rounded-full transition-colors flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-tighter text-gray-400 hidden sm:inline">Batalkan</span>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>

          <div className="flex justify-between items-end">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Total Tagihan</p>
              <p className="text-3xl font-black text-orange-500 tracking-tighter">{FORMAT_CURRENCY(amount)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Bayar Dalam</p>
              <p className="text-lg font-mono font-black text-white">{formatTime(timeLeft)}</p>
            </div>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {PAYMENT_METHODS.map((method) => (
                  <button
                    key={method.code}
                    disabled={isProcessing}
                    onClick={() => {
                      setSelectedMethod(method.code);
                      handlePay(method.code);
                    }}
                    className={`flex items-center gap-4 p-5 rounded-3xl border-2 transition-all group active:scale-95 text-left ${
                      selectedMethod === method.code 
                      ? 'border-orange-500 bg-orange-50/50 shadow-lg' 
                      : 'border-gray-50 bg-gray-50/50 hover:border-gray-200 hover:bg-white hover:shadow-xl'
                    } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className={`w-12 h-12 ${method.color} rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform`}>
                      {method.icon}
                    </div>
                    <div className="flex-grow">
                      <p className="font-black text-xs uppercase tracking-tight text-gray-900">{method.name}</p>
                    </div>
                    <div className="text-gray-300 group-hover:text-orange-500 transform group-hover:translate-x-1 transition-all">
                      {isProcessing && selectedMethod === method.code ? (
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center animate-in zoom-in-95 duration-300">
               {/* Sticky Countdown Bar */}
               <div className="hidden sm:flex w-full sticky top-0 z-10 bg-gray-900 rounded-2xl p-3 mb-6 items-center justify-between shadow-lg">
                 <div className="flex items-center gap-2">
                   <div className={`w-2 h-2 rounded-full ${timeLeft > 0 ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                   <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Sisa Waktu Bayar</span>
                 </div>
                 <span className={`text-sm font-mono font-black ${timeLeft > 300 ? 'text-white' : timeLeft > 0 ? 'text-orange-500' : 'text-red-500'}`}>{formatTime(timeLeft)}</span>
               </div>
               {selectedMethod === 'qris' ? (
                 <div className="space-y-8 w-full max-w-sm text-center">
                    <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl border border-gray-100 flex flex-col items-center">
                        {(() => {
                           // Pakasir might return the data in payment.data, qr_data, qr_string, or payment_number
                           const qrData = directData?.payment?.data || 
                                          directData?.qr_data || 
                                          directData?.qr_string || 
                                          directData?.payment_number || 
                                          directData?.payment?.payment_number ||
                                          directData?.data || '';
                           console.log("[DEBUG] QR Data detected:", qrData ? (qrData.substring(0, 20) + "...") : "empty", "from directData:", directData);
                           
                           if (!qrData && !isProcessing) {
                             return <div className="w-full aspect-square bg-gray-50 rounded-2xl flex items-center justify-center text-[10px] font-bold text-gray-400 uppercase tracking-widest p-10">Data QRIS Belum Tersedia</div>;
                           }

                           return (
                             <img 
                               src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrData)}&size=300x300&margin=10`} 
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
                    {(() => {
                        const qrData = directData?.payment?.data || 
                                      directData?.qr_data || 
                                      directData?.qr_string || 
                                      directData?.payment_number || 
                                      directData?.payment?.payment_number ||
                                      directData?.data || '';
                        if (qrData) {
                          return (
                            <button 
                              onClick={() => handleDownloadQR(qrData)}
                              className="mt-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-orange-100 transition-all active:scale-95 flex items-center justify-center gap-2 mx-auto"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                              Unduh QRIS (PNG)
                            </button>
                          );
                        }
                        return null;
                    })()}
                    <div className="space-y-4">
                        <h2 className="text-xl font-black uppercase text-gray-900">QRIS All Payment</h2>
                        <ul className="text-[10px] font-bold uppercase tracking-widest text-gray-400 space-y-2">
                            <li>1. Buka Aplikasi Pembayaran Anda</li>
                            <li>2. Klik "Scan" atau "Bayar"</li>
                            <li>3. Arahkan Kamera ke QR Code di atas</li>
                            <li>4. Konfirmasi & Selesai</li>
                        </ul>
                    </div>

                    {showAdminSim && (
                        <button 
                          onClick={handleSimulatePayment}
                          className="w-full mt-4 bg-gray-900 border-2 border-dashed border-orange-500 text-orange-500 py-4 rounded-3xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all"
                        >
                          🛠️ ADMIN: SIMULASI BAYAR BERHASIL (SANDBOX ONLY)
                        </button>
                    )}
                 </div>
               ) : (
                 <div className="space-y-10 w-full max-w-sm text-center py-6">
                    <div className="space-y-6">
                        <h2 className="text-xl font-black uppercase text-gray-900 tracking-tight">Instruksi Pembayaran</h2>
                        <div className="bg-gray-50 p-8 rounded-[3rem] border border-gray-100 space-y-4">
                            <div className="flex flex-col items-center gap-2">
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
                                    {PAYMENT_METHODS.find(m => m.code === selectedMethod)?.name || 'Nomor Virtual Account'}
                                </span>
                                <p className="text-3xl font-black text-gray-900 tracking-wider font-mono">
                                    {(() => {
                                        const va = directData?.payment?.va_number || 
                                                   directData?.va_number || 
                                                   directData?.payment_number || 
                                                   directData?.payment?.payment_number ||
                                                   directData?.pay_code || 
                                                   directData?.payment_code || '---';
                                        return va;
                                    })()}
                                </p>
                            </div>
                            <button 
                              onClick={() => {
                                const va = directData?.payment?.va_number || directData?.va_number || directData?.pay_code || directData?.payment_code || '';
                                if (va) copyToClipboard(va);
                              }}
                              className="bg-white px-6 py-2.5 rounded-full border border-gray-200 text-[10px] font-black uppercase tracking-widest text-gray-600 hover:bg-gray-100 active:scale-95 transition-all shadow-sm"
                            >
                                Salin Nomor VA
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4 text-left">
                        <div className="p-5 bg-blue-50/50 rounded-3xl border border-blue-100">
                             <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-2">💡 Tips Pembayaran</p>
                             <p className="text-xs font-bold text-blue-900/70 leading-relaxed">
                                Silakan gunakan aplikasi mobile banking atau ATM terdekat. Pembayaran Anda akan terdeteksi otomatis dalam hitungan detik.
                             </p>
                         </div>
                    </div>

                    {showAdminSim && (
                        <button 
                          onClick={handleSimulatePayment}
                          className="w-full mt-4 bg-gray-900 border-2 border-dashed border-orange-500 text-orange-500 py-4 rounded-3xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all"
                        >
                          🛠️ ADMIN: SIMULASI BAYAR BERHASIL (SANDBOX ONLY)
                        </button>
                    )}
                 </div>
               )}

               <div className="mt-8 px-6 py-2.5 bg-orange-50 rounded-full border border-orange-100 flex items-center gap-2 animate-pulse">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-orange-600">Menunggu pembayaran terdeteksi sistem...</span>
               </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className={`flex-shrink-0 p-6 sm:p-10 border-t border-gray-50 bg-gray-50/50 ${showCheckout ? 'py-6' : ''}`}>
          
          <p className="text-center text-[9px] text-gray-400 font-bold uppercase tracking-widest">
            {showCheckout 
              ? 'Silakan selesaikan pembayaran di atas' 
              : 'Transaksimu di RuangSinggah dijamin aman & terenkripsi oleh Pakasir'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentGateway;
