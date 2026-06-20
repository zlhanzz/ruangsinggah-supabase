import React, { useState, useEffect } from 'react';
import { FORMAT_CURRENCY } from '../../constants';
import { getReferralRewards, payReferralReward, ReferralReward } from '../../adminService';

const ReferralManagement: React.FC = () => {
  const [rewards, setRewards] = useState<ReferralReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'realized' | 'paid'>('all');

  // Modal State untuk konfirmasi bayar
  const [selectedReward, setSelectedReward] = useState<ReferralReward | null>(null);
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load Data
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getReferralRewards();
      setRewards(data);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data referral.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered Rewards
  const filteredRewards = rewards.filter(r => {
    const agentName = (r.agent_name || '').toLowerCase();
    const mitraName = (r.mitra_name || '').toLowerCase();
    const refCode = (r.referral_code || '').toLowerCase();
    const query = searchTerm.toLowerCase();

    const matchesSearch = agentName.includes(query) || mitraName.includes(query) || refCode.includes(query);
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate Statistics
  const stats = {
    totalReferrals: rewards.length,
    pending: rewards.filter(r => r.status === 'pending').length,
    realized: rewards.filter(r => r.status === 'realized').length,
    paid: rewards.filter(r => r.status === 'paid').length,
    totalBonusPaid: rewards.filter(r => r.status === 'paid').reduce((acc, r) => acc + Number(r.bonus_amount), 0),
    totalBonusPending: rewards.filter(r => r.status === 'realized').reduce((acc, r) => acc + Number(r.bonus_amount), 0)
  };

  // Handler Konfirmasi Pembayaran
  const handleConfirmPayment = async () => {
    if (!selectedReward) return;
    setIsSubmitting(true);
    try {
      await payReferralReward(selectedReward.id, paymentNotes);
      alert('Pembayaran reward berhasil dikonfirmasi!');
      setSelectedReward(null);
      setPaymentNotes('');
      loadData(); // Reload
    } catch (err: any) {
      alert(`Gagal memproses: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 uppercase tracking-tight">Sistem Referral Agen</h2>
          <p className="text-xs sm:text-sm text-gray-400 font-bold uppercase tracking-widest mt-1">
            Monitoring registrasi mitra via referral dan realisasi reward
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="px-4 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-orange-500 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
        >
          {loading ? 'Memuat...' : '🔄 Sinkronisasi & Refresh'}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Mitra Diundang</p>
          <p className="text-2xl sm:text-3xl font-black text-gray-900 mt-1">{stats.totalReferrals} Orang</p>
          <p className="text-[10px] text-gray-400 mt-1 font-semibold">{stats.pending} pending • {stats.realized} terealisasi</p>
        </div>

        <div className="bg-orange-50 border border-orange-100 rounded-3xl p-5 shadow-sm">
          <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Realisasi Baru (Siap Bayar)</p>
          <p className="text-2xl sm:text-3xl font-black text-orange-700 mt-1">{stats.realized} Agen</p>
          <p className="text-[10px] text-orange-600 mt-1 font-semibold">Estimasi: {FORMAT_CURRENCY(stats.totalBonusPending)}</p>
        </div>

        <div className="bg-green-50 border border-green-100 rounded-3xl p-5 shadow-sm">
          <p className="text-[10px] font-black text-green-600 uppercase tracking-widest">Bonus Terbayarkan</p>
          <p className="text-2xl sm:text-3xl font-black text-green-700 mt-1">{FORMAT_CURRENCY(stats.totalBonusPaid)}</p>
          <p className="text-[10px] text-green-600 mt-1 font-semibold">Dari {stats.paid} referral terbayar</p>
        </div>

        <div className="bg-gray-50 border border-gray-100 rounded-3xl p-5 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Aturan Reward</p>
          <p className="text-xl sm:text-2xl font-black text-gray-800 mt-1">Rp 50.000</p>
          <p className="text-[9px] text-gray-500 mt-1 font-semibold leading-relaxed">
            Realisasi setelah mitra terundang mengunggah properti pertama.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-gray-100 rounded-[2rem] p-5 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Search */}
        <div className="w-full md:max-w-md relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama agen, mitra, atau kode referral..."
            className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-gray-900 placeholder:text-gray-400"
          />
        </div>

        {/* Status Filter */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {[
            { id: 'all', label: 'Semua Status' },
            { id: 'pending', label: '⏳ Pending' },
            { id: 'realized', label: '🎯 Terealisasi' },
            { id: 'paid', label: '✅ Terbayar' }
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => setStatusFilter(opt.id as any)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                statusFilter === opt.id
                  ? 'bg-gray-900 text-white border-gray-900 shadow-lg'
                  : 'bg-white text-gray-500 hover:bg-gray-50 border-gray-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-4">Memuat data referral...</p>
        </div>
      ) : error ? (
        <div className="text-center py-20 bg-red-50 rounded-3xl border border-red-100 p-8">
          <p className="text-red-500 font-bold text-sm">{error}</p>
          <button
            onClick={loadData}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-black uppercase tracking-widest"
          >
            Coba Lagi
          </button>
        </div>
      ) : filteredRewards.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-[2rem] border border-dashed border-gray-200">
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Tidak ada data referral yang cocok</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-[2rem] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-100">
                  <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Agen Survey</th>
                  <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Kode Ref</th>
                  <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Mitra Terundang</th>
                  <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status Listing</th>
                  <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status Reward</th>
                  <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredRewards.map((reward) => {
                  let statusBadge = '';
                  if (reward.status === 'pending') {
                    statusBadge = 'bg-yellow-50 text-yellow-700 border-yellow-100';
                  } else if (reward.status === 'realized') {
                    statusBadge = 'bg-orange-50 text-orange-700 border-orange-100';
                  } else {
                    statusBadge = 'bg-green-50 text-green-700 border-green-100';
                  }

                  return (
                    <tr key={reward.id} className="border-b border-gray-50 hover:bg-gray-50/30 transition-colors">
                      <td className="p-5">
                        <p className="text-xs font-black text-gray-900">{reward.agent_name}</p>
                        <p className="text-[10px] text-gray-400 font-semibold">{reward.agent_phone}</p>
                      </td>
                      <td className="p-5">
                        <span className="font-mono text-xs font-black text-orange-600 bg-orange-50 px-2.5 py-1 rounded-lg">
                          {reward.referral_code}
                        </span>
                      </td>
                      <td className="p-5">
                        <p className="text-xs font-black text-gray-900">{reward.mitra_name}</p>
                        <p className="text-[10px] text-gray-400 font-semibold">{reward.mitra_phone}</p>
                      </td>
                      <td className="p-5 text-center">
                        {reward.has_property ? (
                          <span className="text-[10px] font-black text-green-600 bg-green-50 px-2.5 py-1 rounded-full border border-green-100">
                            ✅ Listing Properti Ada
                          </span>
                        ) : (
                          <span className="text-[10px] font-black text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100">
                            ❌ Belum Upload Properti
                          </span>
                        )}
                      </td>
                      <td className="p-5 text-center">
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${statusBadge}`}>
                          {reward.status === 'pending' ? '⏳ Pending' : reward.status === 'realized' ? '🎯 Terealisasi' : '✅ Terbayar'}
                        </span>
                        {reward.status === 'paid' && reward.paid_at && (
                          <p className="text-[8px] text-gray-400 mt-1 font-semibold">
                            Lunas: {new Date(reward.paid_at).toLocaleDateString('id-ID')}
                          </p>
                        )}
                      </td>
                      <td className="p-5 text-right">
                        {reward.status === 'realized' ? (
                          <button
                            onClick={() => {
                              setSelectedReward(reward);
                              setPaymentNotes('');
                            }}
                            className="px-3.5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md active:scale-95 transition-all"
                          >
                            💸 Bayar Reward
                          </button>
                        ) : reward.status === 'paid' ? (
                          <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">
                            Lunas ({FORMAT_CURRENCY(reward.bonus_amount)})
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            Menunggu Listing
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI PEMBAYARAN */}
      {selectedReward && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 sm:p-8 animate-in zoom-in-95 duration-300">
            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-2">Konfirmasi Bayar Reward</h3>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-6 border-b border-gray-100 pb-3">
              Transfer komisi akuisisi mitra baru
            </p>

            <div className="space-y-4 mb-6 text-xs font-semibold text-gray-700 bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <div className="flex justify-between">
                <span>Penerima (Agen):</span>
                <span className="font-black text-gray-900">{selectedReward.agent_name}</span>
              </div>
              <div className="flex justify-between">
                <span>Mitra yang Direkrut:</span>
                <span className="font-black text-gray-900">{selectedReward.mitra_name}</span>
              </div>
              <div className="flex justify-between">
                <span>Jumlah Bonus:</span>
                <span className="font-black text-orange-600 text-sm">{FORMAT_CURRENCY(selectedReward.bonus_amount)}</span>
              </div>
            </div>

            <div className="space-y-2 mb-8">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Catatan Pembayaran (Opsional)</label>
              <textarea
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="Misal: Sudah transfer via BCA, No Ref: 12345..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-xs font-bold transition-all"
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedReward(null)}
                className="flex-1 py-3 text-xs font-black text-gray-500 uppercase tracking-widest bg-gray-100 hover:bg-gray-200 rounded-xl transition-all active:scale-95"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmPayment}
                disabled={isSubmitting}
                className="flex-1 py-3 text-xs font-black text-white uppercase tracking-widest bg-orange-500 hover:bg-orange-600 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? 'Memproses...' : 'Ya, Konfirmasi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReferralManagement;
