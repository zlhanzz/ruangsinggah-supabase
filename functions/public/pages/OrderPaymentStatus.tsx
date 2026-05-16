
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import PaymentGateway from '../components/PaymentGateway';

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
             <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
             </svg>
          </div>
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-2">Oops!</h2>
          <p className="text-gray-500 font-medium mb-8">{error || 'Pesanan tidak ditemukan.'}</p>
          <button 
            onClick={() => navigate('/')}
            className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-orange-500 transition-all"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  // Pembayaran sudah PAID
  if (PAID_STATUSES.includes(order.status?.toUpperCase() || '')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="text-center max-w-md">
          <div className="relative mb-6">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto text-green-500 relative z-10">
               <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
               </svg>
            </div>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-28 bg-green-50 rounded-full animate-ping opacity-20"></div>
          </div>
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-2">Pembayaran Sukses!</h2>
          <p className="text-gray-500 font-medium mb-8">
            Tagihan ini sudah diselesaikan. Silakan cek email Anda untuk rincian produk.
          </p>
          <button 
            onClick={() => navigate('/')}
            className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-orange-500 transition-all"
          >
            Lanjut ke Website
          </button>
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
