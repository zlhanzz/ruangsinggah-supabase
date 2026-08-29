
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import PaymentGateway from '../components/PaymentGateway';
import { CheckCircle2, FileText, Home, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { FORMAT_CURRENCY } from '../constants';
import { sendRentReceiptWhatsApp } from '../rentBillingService';

interface OrderPaymentStatusProps {
  user: any;
}

const PAID_STATUSES = ['PAID', 'SETTLEMENT', 'CAPTURE', 'SUCCESS'];
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const OrderPaymentStatus: React.FC<OrderPaymentStatusProps> = ({ user }) => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<any>(null);
  const waReceiptSentRef = useRef<boolean>(false);

  const fetchOrder = async () => {
    if (!orderId) return null;

    // Coba UUID dulu, lalu fallback ke pakasir_order_id
    const isUuid = UUID_REGEX.test(orderId);

    let data: any = null;

    if (isUuid) {
      const { data: d } = await supabase
        .from('transactions').select('*').eq('id', orderId).maybeSingle();
      data = d;
    }

    // Jika bukan UUID atau tidak ditemukan pakai UUID, coba pakasir_order_id
    if (!data) {
      const { data: d } = await supabase
        .from('transactions').select('*').eq('pakasir_order_id', orderId).maybeSingle();
      data = d;
    }

    return data;
  };

  useEffect(() => {
    console.log('[DEBUG] OrderPaymentStatus mount. orderId:', orderId, 'user:', user?.id);
    if (!orderId) return;

    const init = async () => {
      setLoading(true);
      try {
        const data = await fetchOrder();
        if (!data) throw new Error('Pesanan tidak ditemukan.');
        setOrder(data);
      } catch (err: any) {
        console.error('Error fetching order:', err);
        setError(err.message || 'Gagal memuat detail pesanan.');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [orderId]);

  // Polling otomatis setelah halaman dimuat (user baru kembali dari DANA/redirect)
  // Polling berjalan selama status belum PAID, max 60 detik
  useEffect(() => {
    if (!order || PAID_STATUSES.includes(order.status?.toUpperCase() || '')) return;

    let attempts = 0;
    const MAX_ATTEMPTS = 20; // 20 x 3 detik = 60 detik

    pollRef.current = setInterval(async () => {
      attempts++;
      console.log(`[DEBUG] Polling attempt ${attempts} for orderId:`, orderId);
      const fresh = await fetchOrder();
      if (fresh) {
        setOrder(fresh);
        if (PAID_STATUSES.includes(fresh.status?.toUpperCase() || '') || attempts >= MAX_ATTEMPTS) {
          clearInterval(pollRef.current);
        }
      }
    }, 3000);

    return () => clearInterval(pollRef.current);
  }, [order?.id, order?.status]);

  // Auto WhatsApp Receipt Dispatch on detection of PAID status
  useEffect(() => {
    if (order && PAID_STATUSES.includes(order.status?.toUpperCase() || '') && !waReceiptSentRef.current) {
      const meta = order.metadata || {};
      const phone = meta.tenantPhone || meta.userPhone || user?.phone || '';
      if (phone && phone.length > 6) {
        waReceiptSentRef.current = true;
        sendRentReceiptWhatsApp({
          phone,
          tenantName: meta.tenantName || meta.userName || user?.name || 'Penghuni Kost',
          propertyTitle: meta.kostName || meta.propertyTitle || 'Kost RuangSinggah',
          roomNumber: meta.roomNumber || meta.roomType || '1',
          amount: Number(order.amount || order.total_price || 0),
          paymentMethod: order.payment_method || 'QRIS / Payment Gateway',
          orderId: order.id || orderId || '',
          paidAt: order.created_at || new Date().toISOString(),
          billingPeriod: meta.billingPeriod || 'Bulanan',
          newPeriodStart: meta.newPeriodStart,
          newPeriodEnd: meta.newPeriodEnd,
          extraFee: meta.extraFee,
          extraFeeName: meta.extraFeeName,
          basePrice: meta.baseRent || meta.basePrice
        }).then(res => {
          if (res.success) {
            console.log('Automated WhatsApp receipt successfully dispatched to tenant!');
          }
        }).catch(e => console.warn('Failed automated receipt WA dispatch:', e));
      }
    }
  }, [order?.status]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
             <AlertCircle size={40} />
          </div>
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-2">Oops!</h2>
          <p className="text-gray-500 font-medium mb-8">{error || 'Pesanan tidak ditemukan.'}</p>
          <button 
            onClick={() => navigate('/')}
            className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-orange-500 transition-all cursor-pointer"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  // Pembayaran sudah PAID
  if (PAID_STATUSES.includes(order.status?.toUpperCase() || '')) {
    const meta = order.metadata || {};
    const totalAmount = Number(order.amount || order.total_price || 0);
    const cleanId = (order.id || orderId || '').split('-').pop()?.toUpperCase();

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-orange-50/40 via-white to-slate-50 px-4 py-12">
        <div className="text-center max-w-md w-full bg-white rounded-3xl p-8 border border-emerald-100 shadow-xl shadow-emerald-500/5">
          <div className="relative mb-6">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto relative z-10 border border-emerald-200 shadow-sm">
               <CheckCircle2 size={42} />
            </div>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-28 bg-emerald-100/50 rounded-full animate-ping opacity-30"></div>
          </div>

          <span className="text-[10px] font-black tracking-widest text-emerald-700 uppercase bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full inline-block mb-2">
            Transaksi Terverifikasi • LUNAS
          </span>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-1">Pembayaran Berhasil!</h2>
          <p className="text-xs text-gray-500 font-medium mb-6">
            Terima kasih! Pembayaran sewa Anda telah kami terima dan masa sewa kamar telah otomatis diperbarui.
          </p>

          {/* Transaction Summary Card */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-left space-y-2.5 mb-6 text-xs">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-gray-400 font-bold uppercase tracking-wider">No. Kwitansi</span>
              <span className="font-mono font-black text-gray-800">#INV-{cleanId}</span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-gray-400 font-bold uppercase tracking-wider">Properti</span>
              <span className="font-bold text-gray-900">{meta.kostName || meta.propertyTitle || 'Kost RuangSinggah'}</span>
            </div>
            <div className="flex justify-between items-center text-[11px] pt-2 border-t border-slate-200">
              <span className="text-gray-500 font-black uppercase tracking-wider">Total Dibayar</span>
              <span className="font-black text-emerald-700 font-mono text-sm">{FORMAT_CURRENCY(totalAmount)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => navigate(`/receipt/${order.id || orderId}`)}
              className="w-full py-3.5 bg-slate-900 hover:bg-black text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <FileText size={15} /> Buka Kwitansi Resmi (PDF/Cetak)
            </button>
            <button 
              type="button"
              onClick={() => navigate('/my-bookings/aktif')}
              className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Home size={15} /> Akses Kost Saya <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Status masih pending — tampilkan PaymentGateway untuk cek ulang / retry
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      {/* Banner polling aktif */}
      <div className="max-w-lg mx-auto mb-4 bg-orange-50 border border-orange-200 rounded-2xl px-4 py-3 flex items-center gap-3 text-orange-700 text-xs font-bold">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500 shrink-0"></div>
        Menunggu konfirmasi pembayaran dari server... Halaman ini akan otomatis update.
      </div>
      <PaymentGateway
        amount={Number(order.amount)}
        orderId={order.pakasir_order_id || order.id}
        existingOrderId={order.id}
        productId={order.product_id}
        productType={order.product_type as any}
        userId={user?.id || order.user_id}
        isAdmin={user?.role === 'admin'}
        onPaymentSuccess={() => {
          if (order.product_type === 'survey') {
             alert('Pesanan Survey Berhasil! Silakan hubungi admin via WhatsApp untuk jadwal survey.');
             window.open('https://wa.me/6285156634283', '_blank');
          }
          navigate('/');
        }}
        onCancel={() => navigate('/')}
      />
    </div>
  );
};

export default OrderPaymentStatus;
