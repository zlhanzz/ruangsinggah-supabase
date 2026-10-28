import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, Clock, ShieldCheck, CheckCircle2, AlertCircle, 
  Info, X, Users, ArrowRight, Sparkles 
} from 'lucide-react';
import { Kost, RoomType, PricingPeriod } from '../types';
import { FORMAT_CURRENCY } from '../constants';

interface BookingModalProps {
  kost: Kost;
  variant: RoomType;
  initialPeriod?: PricingPeriod;
  onClose: () => void;
  onConfirm: (data: any) => void;
}

const BookingModal: React.FC<BookingModalProps> = ({ kost, variant, initialPeriod, onClose, onConfirm }) => {
  const maxOccupants = variant.maxOccupants || 1;
  const additionalCostPerPerson = variant.additionalCostPerPerson || variant.additional_cost_per_person || variant.extra_person_fee || 0;
  const hasFlexiblePricing = variant.pricing && variant.pricing.length > 0;
  
  const [occupants, setOccupants] = useState<number>(1);
  const [selectedPeriod, setSelectedPeriod] = useState<PricingPeriod>(
    initialPeriod || (hasFlexiblePricing ? variant.pricing![0].period : 'bulanan')
  );
  const [startDate, setStartDate] = useState('');
  const [checkInEta, setCheckInEta] = useState('14:00 - 16:00 WIB (Normal Siang)');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const periodWeights: Record<string, number> = {
    'harian': 1,
    'mingguan': 7,
    'bulanan': 30,
    '3bulanan': 90,
    '6bulanan': 180,
    'tahunan': 360,
  };

  // Determine available options (sorted from shortest to longest)
  const availableOptions = (hasFlexiblePricing 
    ? variant.pricing!.map(p => p.period)
    : ['bulanan', '3bulanan', '6bulanan', 'tahunan']
  ).sort((a, b) => (periodWeights[a] || 999) - (periodWeights[b] || 999));

  // Find lowest active period
  const lowestPeriod = availableOptions.reduce((min, p) => 
    (periodWeights[p] || 999) < (periodWeights[min] || 999) ? p : min
  , availableOptions[0] || 'bulanan');

  // Helper to map backend periods to display logic
  const periodMapping: Record<string, { label: string, months: number, unitLabel: string }> = {
    'harian': { label: 'Harian', months: 0, unitLabel: 'Hari (1 Malam)' },
    'mingguan': { label: 'Mingguan', months: 0, unitLabel: 'Minggu (7 Hari)' },
    'bulanan': { label: 'Bulanan', months: 1, unitLabel: 'Bulan' },
    '3bulanan': { label: '3 Bulan', months: 3, unitLabel: '3 Bulan' },
    '6bulanan': { label: '6 Bulan', months: 6, unitLabel: '6 Bulan' },
    'tahunan': { label: 'Tahunan', months: 12, unitLabel: 'Tahun' },
  };

  // 1. Dynamic Advance Booking Window limit (Safeguard Yield Management)
  const getAdvanceBookingLimitDays = (period: PricingPeriod): number => {
    switch (period) {
      case 'harian': return 5;     // Sewa harian max booking H+5 agar tidak memblokir sewa bulanan
      case 'mingguan': return 14;   // Sewa mingguan max booking H+14
      case 'bulanan':
      case '3bulanan':
      case '6bulanan': return 30;   // Standar bulanan max booking H+30
      case 'tahunan': return 45;    // Sewa tahunan max booking H+45
      default: return 30;
    }
  };

  const advanceLimitDays = getAdvanceBookingLimitDays(selectedPeriod);
  
  // Hitung batas minimum (hari ini) dan maksimum
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  
  const maxBookingDateStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + advanceLimitDays);
    return d.toISOString().split('T')[0];
  }, [advanceLimitDays]);

  // Otomatis sesuaikan startDate jika melebihi batas paket yang baru dipilih
  useEffect(() => {
    if (startDate && startDate > maxBookingDateStr) {
      setStartDate(maxBookingDateStr);
    }
  }, [selectedPeriod, maxBookingDateStr, startDate]);

  // 2. Kalkulasi Otomatis Tanggal Selesai (Check-out Date) & Durasi
  const leaseSchedule = useMemo(() => {
    if (!startDate) return null;
    const startObj = new Date(startDate);
    if (isNaN(startObj.getTime())) return null;

    const endObj = new Date(startObj);
    if (selectedPeriod === 'harian') endObj.setDate(endObj.getDate() + 1);
    else if (selectedPeriod === 'mingguan') endObj.setDate(endObj.getDate() + 7);
    else if (selectedPeriod === 'bulanan') endObj.setMonth(endObj.getMonth() + 1);
    else if (selectedPeriod === '3bulanan') endObj.setMonth(endObj.getMonth() + 3);
    else if (selectedPeriod === '6bulanan') endObj.setMonth(endObj.getMonth() + 6);
    else if (selectedPeriod === 'tahunan') endObj.setFullYear(endObj.getFullYear() + 1);

    const formatOpts: Intl.DateTimeFormatOptions = { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    };

    return {
      endDateIso: endObj.toISOString().split('T')[0],
      formattedStart: startObj.toLocaleDateString('id-ID', formatOpts),
      formattedEnd: endObj.toLocaleDateString('id-ID', formatOpts),
      checkInTime: selectedPeriod === 'harian' ? '14:00 WIB' : '14:00 WIB (Fleksibel)',
      checkOutTime: selectedPeriod === 'harian' ? '12:00 WIB' : '12:00 WIB'
    };
  }, [startDate, selectedPeriod]);

  const getPrice = (period: PricingPeriod, occupantsCount: number) => {
    let basePrice = 0;
    if (hasFlexiblePricing) {
      const scheme = variant.pricing?.find(p => p.period === period);
      basePrice = scheme ? Number(scheme.price) : 0;
    } else {
      // Fallback legacy calculation
      const base = Number(variant.price || 0);
      if (period === 'bulanan') basePrice = base;
      else if (period === '3bulanan') basePrice = base * 3 * 0.95;
      else if (period === '6bulanan') basePrice = base * 6 * 0.90;
      else if (period === 'tahunan') basePrice = base * 12 * 0.85;
    }
    
    const extraCostBase = Number(additionalCostPerPerson || 0);
    const selectedWeight = periodWeights[period] || 30;
    const lowestWeight = periodWeights[lowestPeriod] || 30;
    const proportion = selectedWeight / lowestWeight;
    
    const totalExtraCost = Math.max(0, occupantsCount - 1) * Math.round(extraCostBase * proportion);

    // Add property-wide additional fee if starting from month 1
    let propertyAddFee = 0;
    if (kost.additionalFeePrice && Number(kost.additionalFeePrice) > 0 && kost.additionalFeeStartsFrom !== 'month_2') {
      propertyAddFee = Number(kost.additionalFeePrice);
    }
    
    return basePrice + totalExtraCost + propertyAddFee;
  };

  const currentPrice = getPrice(selectedPeriod, occupants);

  const handleBooking = () => {
    if (!startDate) {
      alert('Silakan pilih tanggal masuk terlebih dahulu.');
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      // Calculate breakdown for onConfirm
      const selectedWeight = periodWeights[selectedPeriod] || 30;
      const lowestWeight = periodWeights[lowestPeriod] || 30;
      const proportion = selectedWeight / lowestWeight;
      
      let basePrice = 0;
      if (hasFlexiblePricing) {
        const scheme = variant.pricing?.find(p => p.period === selectedPeriod);
        basePrice = scheme ? Number(scheme.price) : 0;
      } else {
        const base = Number(variant.price || 0);
        if (selectedPeriod === 'bulanan') basePrice = base;
        else if (selectedPeriod === '3bulanan') basePrice = base * 3 * 0.95;
        else if (selectedPeriod === '6bulanan') basePrice = base * 6 * 0.90;
        else if (selectedPeriod === 'tahunan') basePrice = base * 12 * 0.85;
      }

      const extraPersonFee = Math.max(0, occupants - 1) * Math.round(Number(additionalCostPerPerson || 0) * proportion);
      
      let facilityFee = 0;
      if (kost.additionalFeePrice && Number(kost.additionalFeePrice) > 0) {
        facilityFee = Number(kost.additionalFeePrice);
        if (kost.additionalFeeStartsFrom === 'month_2') {
          facilityFee = 0; // Promo free month 1
        }
      }

      onConfirm({
        period: selectedPeriod,
        startDate,
        endDate: leaseSchedule?.endDateIso,
        formattedStartDate: leaseSchedule?.formattedStart,
        formattedEndDate: leaseSchedule?.formattedEnd,
        checkInTime: leaseSchedule?.checkInTime,
        checkOutTime: leaseSchedule?.checkOutTime,
        checkInEta: selectedPeriod === 'harian' ? checkInEta : null,
        advanceLimitDays,
        total: currentPrice,
        variantName: variant.name,
        occupants: occupants,
        basePrice,
        extraPersonFee,
        facilityFee
      });
      setIsSubmitting(false);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-xl rounded-3xl sm:rounded-[2.5rem] shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 duration-200 border border-gray-100">
        
        {/* Header Modal */}
        <div className="p-6 sm:p-7 border-b border-gray-100 flex justify-between items-start bg-white">
          <div className="pr-4">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-50 border border-orange-100 text-orange-600 text-[10px] font-black uppercase tracking-wider mb-2">
              <Sparkles className="w-3 h-3" /> Pengajuan Sewa Resmi
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight leading-tight">
              {kost.title}
            </h2>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-0.5">
              Tipe: {(variant as any).displayName || variant.name}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors cursor-pointer shrink-0"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3-Step Alur Transaksi Edukatif */}
        <div className="px-6 sm:px-7 py-3.5 bg-gradient-to-r from-orange-50/70 via-amber-50/50 to-emerald-50/60 border-b border-orange-100/60">
          <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-bold text-gray-600 gap-1 sm:gap-2">
            <div className="flex items-center gap-1 sm:gap-1.5 text-orange-600 font-black">
              <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-orange-500 text-white flex items-center justify-center text-[9px] sm:text-[10px]">1</span>
              <span>Ajukan Sewa</span>
            </div>
            <ArrowRight className="w-3 h-3 text-gray-400 shrink-0" />
            <div className="flex items-center gap-1 sm:gap-1.5 text-gray-500">
              <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-[9px] sm:text-[10px]">2</span>
              <span>Persetujuan Pemilik</span>
            </div>
            <ArrowRight className="w-3 h-3 text-gray-400 shrink-0" />
            <div className="flex items-center gap-1 sm:gap-1.5 text-gray-500">
              <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-[9px] sm:text-[10px]">3</span>
              <span>Bayar Resmi</span>
            </div>
          </div>
        </div>

        {/* Konten Scrollable */}
        <div className="p-6 sm:p-7 space-y-6 overflow-y-auto max-h-[65vh]">
          
          {/* 1. Pilih Paket Sewa */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest">
                1. Pilih Paket Sewa
              </label>
              <span className="text-[10px] text-gray-400 font-bold">
                Tersedia {availableOptions.length} Opsi
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {availableOptions.map((periodKey) => {
                const pKey = periodKey as PricingPeriod;
                const price = getPrice(pKey, occupants);
                const isSelected = selectedPeriod === pKey;
                return (
                  <button
                    key={pKey}
                    type="button"
                    onClick={() => setSelectedPeriod(pKey)}
                    className={`p-3.5 rounded-2xl border-2 text-left transition-all relative cursor-pointer ${
                      isSelected 
                        ? 'border-orange-500 bg-orange-50/60 shadow-md shadow-orange-100 ring-2 ring-orange-500/10' 
                        : 'border-gray-100 hover:border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className={`text-xs font-black uppercase tracking-tight ${isSelected ? 'text-orange-600' : 'text-gray-900'}`}>
                        {periodMapping[pKey]?.label || pKey}
                      </p>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-orange-500" />}
                    </div>
                    <p className="text-[11px] text-gray-800 font-extrabold">{FORMAT_CURRENCY(price)}</p>
                    <p className="text-[9px] text-gray-400 font-semibold mt-0.5">
                      /{periodMapping[pKey]?.unitLabel || 'Periode'}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Jumlah Penghuni */}
          {maxOccupants > 1 && (
            <div className="space-y-2.5">
              <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-gray-400" />
                2. Jumlah Penghuni (Maks. {maxOccupants} Orang)
              </label>
              <div className="relative">
                <select
                  value={occupants}
                  onChange={(e) => setOccupants(parseInt(e.target.value))}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all appearance-none cursor-pointer"
                >
                  {Array.from({ length: maxOccupants }).map((_, idx) => {
                    const proportionalCostPerPerson = Math.round(
                      additionalCostPerPerson * (periodWeights[selectedPeriod] / (periodWeights[lowestPeriod] || 30))
                    );
                    return (
                      <option key={idx + 1} value={idx + 1}>
                        {idx + 1} Orang {idx > 0 && additionalCostPerPerson > 0 ? `(+${FORMAT_CURRENCY(proportionalCostPerPerson)} untuk ${periodMapping[selectedPeriod]?.label})` : ''}
                      </option>
                    );
                  })}
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <ArrowRight className="w-4 h-4 rotate-90" />
                </div>
              </div>
            </div>
          )}

          {/* 3. Tanggal Masuk & Batas Booking Dinamis */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
              <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                3. Pilih Tanggal Masuk (Check-in)
              </label>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-100">
                <Clock className="w-3 h-3" /> Maksimal H+{advanceLimitDays} hari
              </span>
            </div>

            <div className="relative">
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={todayStr}
                max={maxBookingDateStr}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all cursor-pointer"
              />
            </div>

            {selectedPeriod === 'harian' && (
              <p className="text-[10px] text-gray-500 font-medium leading-relaxed bg-amber-50/60 p-2.5 rounded-xl border border-amber-100 flex items-start gap-2">
                <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Sewa Harian dibatasi maksimal pemesanan <strong>H+5 hari</strong> ke depan untuk menjaga slot sewa bulanan dan kepastian kesiapan kamar bagi pemilik kost.
                </span>
              </p>
            )}
          </div>

          {/* 4. Khusus Sewa Harian: Jam Operasional & Dropdown Jam Tiba (ETA) */}
          {selectedPeriod === 'harian' && (
            <div className="space-y-3 p-4 rounded-2xl bg-orange-50/40 border border-orange-100 animate-in fade-in duration-200">
              <div className="flex items-center justify-between text-xs font-black text-gray-800">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-orange-500" /> Waktu Check-in & Check-out Kost
                </span>
                <span className="text-[10px] font-bold text-orange-600 bg-white px-2 py-0.5 rounded-full border border-orange-200">
                  Wajib Diperhatikan
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="bg-white p-2.5 rounded-xl border border-orange-100">
                  <p className="text-[9px] text-gray-400 font-black uppercase">Check-in Mulai</p>
                  <p className="text-sm font-black text-gray-900 mt-0.5">14:00 WIB</p>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-orange-100">
                  <p className="text-[9px] text-gray-400 font-black uppercase">Check-out Maks</p>
                  <p className="text-sm font-black text-gray-900 mt-0.5">12:00 WIB</p>
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider">
                  Estimasi Jam Kedatangan (ETA) Anda:
                </label>
                <select
                  value={checkInEta}
                  onChange={(e) => setCheckInEta(e.target.value)}
                  className="w-full bg-white border border-orange-200 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 cursor-pointer"
                >
                  <option value="14:00 - 16:00 WIB (Normal Siang)">14:00 - 16:00 WIB (Normal Siang)</option>
                  <option value="16:00 - 18:00 WIB (Sore Hari)">16:00 - 18:00 WIB (Sore Hari)</option>
                  <option value="18:00 - 20:00 WIB (Malam Hari)">18:00 - 20:00 WIB (Malam Hari)</option>
                  <option value="Di atas 20:00 WIB (Konfirmasi Khusus Penjaga)">Di atas 20:00 WIB (Konfirmasi Khusus Penjaga Kost)</option>
                </select>
                <p className="text-[9px] text-gray-400 font-medium">
                  *Membantu pemilik/penjaga kost mempersiapkan kunci dan menyambut kedatangan Anda.
                </p>
              </div>
            </div>
          )}

          {/* 5. Kartu Ringkasan Masa Sewa (Transparan Sesuai Standar Proptech) */}
          {leaseSchedule && (
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-2.5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between text-[11px] font-black text-gray-600 uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-gray-500" /> Ringkasan Masa Sewa
                </span>
                <span className="text-[10px] font-bold text-gray-500">
                  {periodMapping[selectedPeriod]?.unitLabel}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
                <div className="bg-white p-3 rounded-xl border border-gray-100">
                  <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest block">Tanggal Mulai</span>
                  <span className="font-bold text-gray-900 block mt-0.5">{leaseSchedule.formattedStart}</span>
                  <span className="text-[10px] text-gray-400 font-medium">{leaseSchedule.checkInTime}</span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-gray-100">
                  <span className="text-[9px] font-black text-rose-600 uppercase tracking-widest block">Tanggal Berakhir</span>
                  <span className="font-bold text-gray-900 block mt-0.5">{leaseSchedule.formattedEnd}</span>
                  <span className="text-[10px] text-gray-400 font-medium">{leaseSchedule.checkOutTime}</span>
                </div>
              </div>
            </div>
          )}

          {/* 6. Rincian Harga & Garansi Uang Kembali */}
          <div className="bg-gray-50 rounded-2xl sm:rounded-3xl p-5 sm:p-6 space-y-3.5 border border-gray-100">
            <div className="space-y-2.5">
              <div className="flex justify-between items-center text-xs font-bold text-gray-500">
                <span>Harga Sewa Dasar ({periodMapping[selectedPeriod]?.label || selectedPeriod})</span>
                <span className="text-gray-900 font-black">
                  {FORMAT_CURRENCY(hasFlexiblePricing ? (variant.pricing?.find(p => p.period === selectedPeriod)?.price || 0) : (selectedPeriod === 'bulanan' ? variant.price : getPrice(selectedPeriod, 1)))}
                </span>
              </div>
              
              {occupants > 1 && additionalCostPerPerson > 0 && (
                <div className="flex justify-between items-center text-xs font-bold text-orange-600">
                  <span>Tambahan {occupants - 1} Orang</span>
                  <span className="font-black">
                    +{FORMAT_CURRENCY(Math.max(0, occupants - 1) * Math.round(additionalCostPerPerson * (periodWeights[selectedPeriod] / (periodWeights[lowestPeriod] || 30))))}
                  </span>
                </div>
              )}

              {kost.additionalFeePrice > 0 && kost.additionalFeeStartsFrom !== 'month_2' && (
                <div className="flex justify-between items-center text-xs font-bold text-blue-600">
                  <span>{kost.additionalFeeName || 'Biaya Fasilitas Properti'}</span>
                  <span className="font-black">+{FORMAT_CURRENCY(kost.additionalFeePrice)}</span>
                </div>
              )}
            </div>

            <div className="h-px bg-gray-200" />

            <div className="flex justify-between items-end pt-1">
              <div>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">
                  Total Estimasi Tagihan
                </p>
                <p className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight leading-none">
                  {FORMAT_CURRENCY(currentPrice)}
                </p>
                {kost.additionalFeeStartsFrom === 'month_2' && (
                  <p className="text-[9px] text-emerald-600 font-bold mt-1.5 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Promo: {kost.additionalFeeName || 'Biaya Tambahan'} Gratis Bulan Pertama
                  </p>
                )}
              </div>
              <div className="text-right">
                <span className="inline-block px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 text-[9px] font-black uppercase tracking-wider">
                  Menunggu Persetujuan
                </span>
              </div>
            </div>

            {/* Jaminan Keamanan Transaksi */}
            <div className="mt-2 pt-2 border-t border-gray-200/60 flex items-center gap-2 text-[10px] font-semibold text-emerald-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Garansi 100% uang kembali jika kamar tidak sesuai atau dibatalkan oleh pemilik kost.</span>
            </div>
          </div>
        </div>

        {/* Footer Tombol Aksi */}
        <div className="p-5 sm:p-6 bg-gray-50/70 border-t border-gray-100">
          <button 
            onClick={handleBooking}
            disabled={isSubmitting}
            className={`w-full bg-orange-500 text-white py-4 sm:py-4.5 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-widest shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer ${
              isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-orange-600'
            }`}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Mengajukan Sewa...</span>
              </>
            ) : (
              <>
                <span>Ajukan Sewa Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
          <p className="text-[10px] text-gray-400 font-bold text-center mt-2.5">
            Langkah 1 dari 3: Pembayaran baru akan dilakukan setelah pemilik kost menyetujui pengajuan Anda.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
