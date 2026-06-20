import React, { useState, useEffect, useMemo } from 'react';
import { Page } from '../types';
import { getSurveyCatalogSettings } from '../adminService';
import { getUserTransactions } from '../userService';
import PaymentGateway from '../components/PaymentGateway';
import { Plus, Trash2, MapPin, Calendar, ShieldCheck, ArrowRight, ArrowLeft, CheckCircle, AlertTriangle, ChevronRight } from 'lucide-react';

const SURVEY_PRODUCT_ID = '5ea7b4e9-6f8d-4a11-b845-8c7a726359e1';
const MAX_KOST = 5;

const formatRupiah = (val: number) => 'Rp ' + val.toLocaleString('id-ID');

interface KostItem {
  id: string;
  kostName: string;
  ownerPhone: string;
  kostAddress: string;
  source: string;
}

interface SurveyCheckoutProps {
  user: any;
  onPageChange: (page: Page) => void;
  validateProfile?: () => boolean;
}

const emptyKost = (): KostItem => ({
  id: Date.now().toString() + Math.random(),
  kostName: '',
  ownerPhone: '',
  kostAddress: '',
  source: '',
});

const SurveyCheckout: React.FC<SurveyCheckoutProps> = ({ user, onPageChange, validateProfile }) => {
  const [step, setStep] = useState(1);
  // unitPrice = harga per kost (discount_price jika ada, else price) — SELALU dari DB
  const [unitPrice, setUnitPrice] = useState(0);
  const [kostList, setKostList] = useState<KostItem[]>([emptyKost()]);
  const [surveyDate, setSurveyDate] = useState('');
  const [surveyTime, setSurveyTime] = useState('');
  const [notes, setNotes] = useState('');
  const [agreedToTnC, setAgreedToTnC] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [paymentMetadata, setPaymentMetadata] = useState<any>(null);
  const [hasBoughtDatabase, setHasBoughtDatabase] = useState(false);

  const [formInfo, setFormInfo] = useState({
    name: '',
    phone: '',
    email: '',
  });

  const [priceLoaded, setPriceLoaded] = useState(false);
  const [agentCommissionFlat, setAgentCommissionFlat] = useState(35000);

  useEffect(() => {
    getSurveyCatalogSettings().then(s => {
      // Gunakan discount_price sebagai harga aktif jika lebih kecil dari price (ada promo)
      // Ini adalah harga yang SAMA yang ditampilkan di landing page
      const discountPrice = Number(s.discount_price) || 0;
      const basePrice = Number(s.price) || 70000;
      const effective = (discountPrice > 0 && discountPrice < basePrice) ? discountPrice : basePrice;
      console.log('[SurveyCheckout] unitPrice dari DB:', effective, '| raw:', s);
      setUnitPrice(effective);
      setAgentCommissionFlat(s.agent_commission_flat ?? 35000);
      setPriceLoaded(true);
    }).catch((err) => {
      console.error('[SurveyCheckout] Gagal load harga:', err);
      setUnitPrice(70000);
      setAgentCommissionFlat(35000);
      setPriceLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (user) {
      setFormInfo({
        name: user.name || user.displayName || '',
        phone: (user.phone || '').replace(/^(\+62|62|0)/, ''),
        email: user.email || '',
      });

      // Check if user has bought a database product
      const uid = user.uid || user.id;
      if (uid) {
        getUserTransactions(uid).then(transactions => {
          const hasDbPurchase = transactions.some(t => 
            t.product_type === 'database' && 
            (t.status?.toUpperCase() === 'PAID' || t.status?.toLowerCase() === 'paid')
          );
          console.log('[SurveyCheckout] User database purchase status:', hasDbPurchase);
          setHasBoughtDatabase(hasDbPurchase);
        }).catch(err => {
          console.error('[SurveyCheckout] Gagal check transaksi database:', err);
        });
      }
    }
  }, [user]);

  // Total = sum of each kost unit price (discount 30% if source is database and user has bought database)
  const totalPrice = useMemo(() => {
    return kostList.reduce((sum, k) => {
      if (hasBoughtDatabase && k.source === 'database') {
        return sum + (unitPrice * 0.7);
      }
      return sum + unitPrice;
    }, 0);
  }, [kostList, unitPrice, hasBoughtDatabase]);

  const addKost = () => {
    if (kostList.length >= MAX_KOST) return;
    setKostList(prev => [...prev, emptyKost()]);
  };

  const removeKost = (id: string) => {
    if (kostList.length <= 1) return;
    setKostList(prev => prev.filter(k => k.id !== id));
  };

  const updateKost = (id: string, field: keyof KostItem, value: string) => {
    setKostList(prev => prev.map(k => k.id === id ? { ...k, [field]: value } : k));
  };

  const normalizePhone = (p: string) => {
    let clean = p.replace(/\D/g, '');
    if (clean.startsWith('0')) clean = clean.substring(1);
    if (clean.startsWith('62')) clean = clean.substring(2);
    return `+62${clean}`;
  };

  const validateStep = () => {
    if (step === 1) {
      if (!formInfo.name || !formInfo.phone || !formInfo.email) {
        alert('Harap isi semua data diri'); return false;
      }
    }
    if (step === 2) {
      for (const k of kostList) {
        if (!k.kostName || !k.kostAddress || !k.source) {
          alert('Harap lengkapi semua data kost'); return false;
        }
      }
    }
    if (step === 3) {
      if (!surveyDate || !surveyTime) {
        alert('Harap pilih jadwal survey'); return false;
      }
    }
    return true;
  };

  const handleSubmit = () => {
    if (!validateProfile || validateProfile()) {
      const meta = {
        ...formInfo,
        userName: formInfo.name,
        userEmail: formInfo.email,
        userPhone: normalizePhone(formInfo.phone),
        phone: normalizePhone(formInfo.phone),
        kostName: kostList.map(k => k.kostName).join(', '),
        kostList: kostList.map(k => ({
          ...k,
          ownerPhone: normalizePhone(k.ownerPhone),
        })),
        surveyDate,
        surveyTime,
        notes,
        item: 'Jasa Survey Lokasi Kost',
        service_name: 'Jasa Survey Lokasi Kost',
        package_price: totalPrice,
        kost_count: kostList.length,
        price_per_kost: unitPrice,
        agent_commission_flat: agentCommissionFlat, // SIMPAN NOMINAL KOMISI HISTORIS DI TRANSAKSI
        has_database_discount: hasBoughtDatabase && kostList.some(k => k.source === 'database'),
        discount_amount: (kostList.length * unitPrice) - totalPrice,
      };
      setPaymentMetadata(meta);
      setShowPayment(true);
    }
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in-95 duration-500">
          <div className="relative">
            <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-green-50 relative z-10">
              <CheckCircle className="w-12 h-12" />
            </div>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-green-50 rounded-full animate-ping opacity-20" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight mb-4">Pesanan Survey Berhasil!</h2>
            <p className="text-gray-500 font-medium">Pembayaran Jasa Survey Anda telah kami terima. Tim kami akan segera menghubungi Anda.</p>
          </div>
          <div className="bg-orange-50 p-6 rounded-[2rem] border border-orange-100 text-left space-y-2">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Detail Pesanan</p>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 font-bold">Jumlah Kost:</span>
              <span className="text-gray-900 font-black">{kostList.length} lokasi</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 font-bold">Jadwal:</span>
              <span className="text-gray-900 font-black">{surveyDate} @ {surveyTime} WIB</span>
            </div>
            <div className="flex justify-between text-sm border-t border-orange-100/50 pt-2">
              <span className="text-gray-500 font-bold">Total:</span>
              <span className="text-orange-600 font-black">{formatRupiah(totalPrice)}</span>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <button onClick={() => onPageChange(Page.MY_BOOKINGS)} className="bg-orange-500 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-orange-100 active:scale-95 transition-all flex items-center justify-center gap-2">
              Lihat Status di Kost Saya <ChevronRight className="w-5 h-5" />
            </button>
            <button onClick={() => onPageChange(Page.HOME)} className="text-gray-500 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-50 transition-all">
              Kembali ke Beranda
            </button>
          </div>
        </div>
      </div>
    );
  }

  const steps = ['Data Diri', 'Detail Kost', 'Jadwal', 'Konfirmasi'];

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => step > 1 ? setStep(step - 1) : onPageChange(Page.SURVEY_SERVICE)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div className="text-center">
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Checkout Survey</p>
            <p className="text-sm font-black text-gray-900">{steps[step - 1]}</p>
          </div>
          <div className="w-9" />
        </div>
        {/* Progress */}
        <div className="h-1 bg-gray-100">
          <div className="h-full bg-orange-500 transition-all duration-500" style={{ width: `${(step / 4) * 100}%` }} />
        </div>
        <div className="max-w-2xl mx-auto px-4 py-2 flex justify-between">
          {steps.map((s, i) => (
            <div key={s} className={`text-[10px] font-black uppercase tracking-widest ${i + 1 <= step ? 'text-orange-500' : 'text-gray-300'}`}>{s}</div>
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 pb-32">

        {/* STEP 1: INFO */}
        {step === 1 && (
          <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
            <div className="bg-orange-50 p-4 rounded-2xl flex items-start gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600 shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">Data Pemesan</p>
                <p className="text-xs text-gray-500">Data ini digunakan untuk pengiriman hasil survey.</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Nama Lengkap</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all" value={formInfo.name} onChange={e => setFormInfo({ ...formInfo, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Nomor WhatsApp</label>
                <div className="flex bg-white rounded-xl border border-gray-200 focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500 overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 border-r border-gray-100 text-gray-400 font-black text-xs flex items-center">+62</div>
                  <input type="tel" className="flex-1 px-4 py-3 outline-none text-sm font-medium" value={formInfo.phone} onChange={e => {
                    let v = e.target.value.replace(/\D/g, '');
                    if (v.startsWith('0')) v = v.substring(1);
                    if (v.startsWith('62')) v = v.substring(2);
                    setFormInfo({ ...formInfo, phone: v });
                  }} />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Email</label>
                <input type="email" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all" value={formInfo.email} onChange={e => setFormInfo({ ...formInfo, email: e.target.value })} />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: KOST LIST */}
        {step === 2 && (
          <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
            {/* Pricing Info */}
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-5 text-white">
              <p className="text-xs font-black uppercase tracking-widest opacity-80 mb-2">Harga Otomatis</p>
              {!priceLoaded ? (
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span className="text-white/80 text-sm font-bold">Memuat harga dari server...</span>
                </div>
              ) : (
                <>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black">{formatRupiah(totalPrice)}</span>
                  </div>
                  <div className="text-xs opacity-90 mt-2 space-y-1">
                    {kostList.map((k, i) => {
                      const isDiscounted = hasBoughtDatabase && k.source === 'database';
                      return (
                        <div key={k.id} className="flex justify-between">
                          <span>Kost #{i + 1} ({k.source === 'database' ? 'Database' : k.source ? 'Lainnya' : 'Belum dipilih'}):</span>
                          <span>
                            {isDiscounted ? (
                              <span>
                                <span className="line-through opacity-60 mr-1.5">{formatRupiah(unitPrice)}</span>
                                <span className="font-bold text-green-300">{formatRupiah(unitPrice * 0.7)}</span>
                              </span>
                            ) : (
                              formatRupiah(unitPrice)
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {hasBoughtDatabase && kostList.some(k => k.source === 'database') && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-xs text-green-800 flex items-center gap-2 animate-in fade-in">
                <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                <span>Selamat! Anda mendapatkan <strong>potongan 30%</strong> untuk unit kost yang bersumber dari database Ruang Singgah.</span>
              </div>
            )}
            {!hasBoughtDatabase && kostList.some(k => k.source === 'database') && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 flex items-center gap-2 animate-in fade-in">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Beli produk <strong>database kost</strong> kami terlebih dahulu untuk mendapatkan diskon 30% Jasa Survey.</span>
              </div>
            )}

            {kostList.map((kost, idx) => (
              <div key={kost.id} className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-orange-100 rounded-lg flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-orange-600" />
                    </div>
                    <p className="font-black text-gray-900 text-sm uppercase">Kost #{idx + 1}</p>
                  </div>
                  {kostList.length > 1 && (
                    <button onClick={() => removeKost(kost.id)} className="p-1.5 bg-red-50 text-red-400 rounded-lg hover:bg-red-100 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Nama Kost / Link Kost</label>
                  <input type="text" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all" placeholder="Nama atau Link Google Maps" value={kost.kostName} onChange={e => updateKost(kost.id, 'kostName', e.target.value)} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">No HP Pemilik/Penjaga</label>
                  <div className="flex bg-white rounded-xl border border-gray-200 focus-within:ring-2 focus-within:ring-orange-500 overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 border-r border-gray-100 text-gray-400 font-black text-xs flex items-center">+62</div>
                    <input type="tel" className="flex-1 px-4 py-3 outline-none text-sm" value={kost.ownerPhone} onChange={e => {
                      let v = e.target.value.replace(/\D/g, '');
                      if (v.startsWith('0')) v = v.substring(1);
                      if (v.startsWith('62')) v = v.substring(2);
                      updateKost(kost.id, 'ownerPhone', v);
                    }} />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Sumber Info</label>
                  <select className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none bg-white" value={kost.source} onChange={e => updateKost(kost.id, 'source', e.target.value)}>
                    <option value="" disabled>Pilih Sumber Info</option>
                    <option value="database">Database Ruang Singgah</option>
                    <option value="social_media">Sosial Media</option>
                    <option value="google_maps">Google Maps</option>
                    <option value="other">Lainnya</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Alamat Lengkap</label>
                  <textarea rows={2} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all" placeholder="Alamat lengkap lokasi kost..." value={kost.kostAddress} onChange={e => updateKost(kost.id, 'kostAddress', e.target.value)} />
                </div>
              </div>
            ))}

            {kostList.length < MAX_KOST && (
              <button onClick={addKost} className="w-full py-4 border-2 border-dashed border-orange-200 rounded-2xl text-orange-500 font-black text-sm uppercase tracking-widest hover:border-orange-400 hover:bg-orange-50 transition-all flex items-center justify-center gap-2">
                <Plus className="w-5 h-5" /> Tambah Kost ({kostList.length}/{MAX_KOST})
              </button>
            )}
          </div>
        )}

        {/* STEP 3: JADWAL */}
        {step === 3 && (
          <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
            <div className="bg-green-50 p-4 rounded-2xl flex items-start gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-green-600 shrink-0">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">Jadwal Survey</p>
                <p className="text-xs text-gray-500">Pilih waktu untuk video call live dengan agen kami.</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm space-y-5">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Tanggal</label>
                <input type="date" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none bg-white cursor-pointer" value={surveyDate} min={new Date().toISOString().split('T')[0]} onChange={e => setSurveyDate(e.target.value)} />
                <div className="flex gap-2 mt-2">
                  {[{ label: 'Besok', offset: 1 }, { label: 'Lusa', offset: 2 }].map(q => {
                    const d = new Date(); d.setDate(d.getDate() + q.offset);
                    const ds = d.toISOString().split('T')[0];
                    return (
                      <button key={q.label} type="button" onClick={() => setSurveyDate(ds)} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${surveyDate === ds ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-500 border-gray-100 hover:border-orange-200'}`}>
                        {q.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Jam (WIB)</label>
                <input type="time" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none bg-white cursor-pointer" value={surveyTime} onChange={e => setSurveyTime(e.target.value)} />
                <div className="flex flex-wrap gap-2 mt-2">
                  {['09:00', '11:00', '13:30', '16:00'].map(slot => (
                    <button key={slot} type="button" onClick={() => setSurveyTime(slot)} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${surveyTime === slot ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-500 border-gray-100 hover:border-orange-200'}`}>
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Catatan (Opsional)</label>
                <textarea className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all" placeholder="Tolong cek kebersihan kamar mandi, dll..." rows={2} value={notes} onChange={e => setNotes(e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: KONFIRMASI */}
        {step === 4 && (
          <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
            <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ringkasan Pesanan</p>
              <div className="flex justify-between text-xs py-2 border-b border-gray-100">
                <span className="text-gray-400 font-bold uppercase">Pemesan</span>
                <span className="text-gray-900 font-black">{formInfo.name}</span>
              </div>
              <div className="flex justify-between text-xs py-2 border-b border-gray-100">
                <span className="text-gray-400 font-bold uppercase">Jumlah Kost</span>
                <span className="text-gray-900 font-black">{kostList.length} lokasi</span>
              </div>
              {kostList.map((k, i) => (
                <div key={k.id} className="flex justify-between text-xs py-1">
                  <span className="text-gray-400 font-bold">Kost #{i + 1}</span>
                  <span className="text-gray-700 font-bold text-right max-w-[60%] truncate">{k.kostName}</span>
                </div>
              ))}
              <div className="flex justify-between text-xs py-2 border-b border-gray-100">
                <span className="text-gray-400 font-bold uppercase">Jadwal</span>
                <span className="text-gray-900 font-black">{surveyDate} @ {surveyTime} WIB</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-gray-100">
                <span className="text-gray-900 font-black uppercase">Total Bayar</span>
                <span className="text-orange-600 font-black text-lg">{formatRupiah(totalPrice)}</span>
              </div>
              <div className="text-[10px] text-gray-400 italic space-y-1">
                {kostList.map((k, i) => {
                  const isDiscounted = hasBoughtDatabase && k.source === 'database';
                  return (
                    <div key={k.id} className="flex justify-between">
                      <span>Kost #{i + 1} ({k.source === 'database' ? 'Database Ruang Singgah' : 'Sumber Lain'}):</span>
                      <span className={isDiscounted ? 'text-green-600 font-black' : 'font-medium'}>
                        {isDiscounted ? `${formatRupiah(unitPrice * 0.7)} (Diskon 30%)` : formatRupiah(unitPrice)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-xl border border-orange-100">
              <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
              <p className="text-[10px] text-orange-700 leading-relaxed font-medium">Anda akan diarahkan ke Payment Gateway aman kami. Pastikan semua detail sudah benar.</p>
            </div>

            <div
              onClick={() => setAgreedToTnC(!agreedToTnC)}
              className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all select-none ${agreedToTnC ? 'bg-green-50 border-green-400' : 'bg-gray-50 border-gray-200 hover:border-orange-300'}`}
            >
              <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5 border-2 ${agreedToTnC ? 'bg-green-500 border-green-500' : 'bg-white border-gray-300'}`}>
                {agreedToTnC && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">Saya telah membaca dan menyetujui <span className="text-orange-600 font-bold">Syarat & Ketentuan</span> Layanan Jasa Survey Ruang Singgah.</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 z-30">
        <div className="max-w-2xl mx-auto flex gap-3">
          {step > 1 && (
            <button onClick={() => setStep(step - 1)} className="flex-1 py-3.5 bg-white text-gray-500 font-bold rounded-xl border border-gray-200 hover:bg-gray-50 transition-all">
              Kembali
            </button>
          )}
          {step < 4 ? (
            <button
              onClick={() => { if (validateStep()) setStep(step + 1); }}
              className="flex-[2] py-3.5 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
            >
              Lanjutkan <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!agreedToTnC || !priceLoaded}
              className={`flex-[2] py-3.5 font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                (agreedToTnC && priceLoaded) ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {!priceLoaded ? 'Memuat harga...' : 'Selesaikan & Bayar'} <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Payment */}
      {showPayment && user && (
        <PaymentGateway
          amount={totalPrice}
          orderId={`SRV-${Date.now()}`}
          productId={SURVEY_PRODUCT_ID}
          productType="survey"
          userId={user.uid || user.id}
          metadata={paymentMetadata}
          onPaymentSuccess={() => { setShowPayment(false); setShowSuccess(true); }}
          onCancel={() => setShowPayment(false)}
        />
      )}
    </div>
  );
};

export default SurveyCheckout;
