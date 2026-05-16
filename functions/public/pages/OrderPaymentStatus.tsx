
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import PaymentGateway from '../components/PaymentGateway';

interface OrderPaymentStatusProps {
  user: any;
}

const OrderPaymentStatus: React.FC<OrderPaymentStatusProps> = ({ user }) => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("[DEBUG] OrderPaymentStatus mount. orderId:", orderId, "user:", user?.id);
    if (!orderId) {
      console.warn("[DEBUG] No orderId in URL params.");
      return;
    }

    const fetchOrder = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('id', orderId)
          .single();

        if (error) throw error;
        if (!data) throw new Error('Pesanan tidak ditemukan.');

        setOrder(data);
      } catch (err: any) {
        console.error('Error fetching order:', err);
        setError(err.message || 'Gagal memuat detail pesanan.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

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

  // Handle case where order is already paid
  if (order.status?.toUpperCase() === 'PAID') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500">
             <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
             </svg>
          </div>
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-2">Pembayaran Sukses!</h2>
          <p className="text-gray-500 font-medium mb-8">Tagihan ini sudah diselesaikan. Silakan cek email Anda untuk rincian produk.</p>
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

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <PaymentGateway
        amount={Number(order.amount)}
        orderId={order.product_type === 'database' ? `DB-${order.id.substring(0,8).toUpperCase()}` : `SRV-${order.id.substring(0,8).toUpperCase()}`}
        existingOrderId={order.id}
        productId={order.product_id}
        productType={order.product_type as any}
        userId={user?.id || order.user_id}
        isAdmin={user?.role === 'admin'}
        onPaymentSuccess={() => {
          // If survey, maybe redirect to WA? But PaymentGateway might handle it if we are on SurveyService.
          // However, here we are on a dedicated status page.
          if (order.product_type === 'survey') {
             // For survey, we might need the same WA redirection logic here if the user just paid from email.
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
