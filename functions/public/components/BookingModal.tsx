import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, Clock, ShieldCheck, CheckCircle2, AlertCircle, 
  Info, X, Users, ArrowRight, Sparkles, Home, MapPin 
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
  const [imgError, setImgError] = useState(false);

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

  const propertyPhoto = (variant.images && variant.images[0]) || 
    (kost.images && kost.images[0]) || 
    ((kost as any).imageUrls && (kost as any).imageUrls[0]) || 
    '';

  const roomDisplayName = (variant as any).displayName || variant.name || 'Standard';
  const locationSummary = kost.location?.city || (kost as any).city || (kost as any).district || (kost.address ? kost.address.split(',')[0] : '');

  return (
    <div className="fixed inset-0 z-[90] flex flex-col justify-end sm:justify-center items-center overflow-hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />
      
      {/* Modal Dialog / Mobile Bottom Sheet */}
      <div className="relative bg-white w-full sm:max-w-lg rounded-t-[2rem] sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[88vh] animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 border border-gray-100 z-10">
        
        {/* Mobile Drag Indicator */}
        <div className="sm:hidden w-10 h-1 bg-gray-200 rounded-full mx-auto mt-2.5 mb-1 shrink-0" />

        {/* Header Properti Personal & Humanis */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between gap-3 bg-white shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {/* Thumbnail Kamar / Kost */}
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shrink-0 flex items-center justify-center">
              {propertyPhoto && !imgError ? (
                <img 
                  src={propertyPhoto} 
                  alt={kost.title} 
                  onError={() => setImgError(true)} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <Home className="w-5 h-5 text-gray-400" />
              )}
            </div>

            {/* Nama & Tipe Unit */}
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-black text-gray-900 tracking-tight truncate capitalize leading-tight">
                {kost.title}
              </h2>
              <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium mt-0.5 truncate">
                <span className="font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider">
                  Tipe {roomDisplayName}
                </span>
                {locationSummary && (
                  <>
                    <span className="text-gray-300">•</span>
                    <span className="truncate text-[11px] text-gray-500">{locationSummary}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Close Button */}
          <button 
            onClick={onClose} 
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors cursor-pointer shrink-0"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Subtle Reassurance Bar (Pengganti Stepper Berat) */}
        <div className="px-5 py-2.5 bg-orange-50/70 border-b border-orange-100/70 flex items-center justify-between text-[11px] text-orange-950 shrink-0">
          <div className="flex items-center gap-1.5 font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-orange-600 shrink-0" />
            <span>Pengajuan Bebas Biaya</span>
          </div>
          <span className="text-gray-500 text-[10px] font-medium">Bisa bayar setelah di-ACC pemilik</span>
        </div>

        {/* Konten Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 overscroll-contain">
          
          {/* Pilih Durasi Sewa */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-gray-800">
                Pilih Durasi Sewa
              </label>
              <span className="text-[10px] text-gray-400 font-medium">
                {availableOptions.length} Opsi Tersedia
              </span>
            </div>

            <div className={`grid ${availableOptions.length <= 4 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'} gap-2`}>
              {availableOptions.map((periodKey) => {
                const pKey = periodKey as PricingPeriod;
                const price = getPrice(pKey, occupants);
                const isSelected = selectedPeriod === pKey;
                return (
                  <button
                    key={pKey}
                    type="button"
                    onClick={() => setSelectedPeriod(pKey)}
                    className={`p-2.5 sm:p-3 rounded-2xl border text-left transition-all relative cursor-pointer flex flex-col justify-between ${
                      isSelected 
                        ? 'border-orange-500 bg-orange-50/70 shadow-sm ring-1 ring-orange-500/20' 
                        : 'border-gray-200/90 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className={`text-[11px] font-bold ${isSelected ? 'text-orange-600' : 'text-gray-700'}`}>
                        {periodMapping[pKey]?.label || pKey}
                      </span>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-orange-500 shrink-0" />}
                    </div>
                    <div>
                      <p className="text-xs font-black text-gray-900 leading-tight">
                        {FORMAT_CURRENCY(price)}
                      </p>
                      <p className="text-[9.5px] text-gray-400 font-medium">
                        /{periodMapping[pKey]?.unitLabel || 'periode'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Grid Terpadu: Tanggal Masuk & Jumlah Tamu */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {/* Tanggal Masuk */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-orange-500" /> Tanggal Masuk
                </label>
                <span className="text-[9.5px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100">
                  Maks. H+{advanceLimitDays}
                </span>
              </div>
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={todayStr}
                max={maxBookingDateStr}
                className="w-full bg-gray-50 border border-gray-200/90 rounded-xl px-3.5 py-2.5 text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 cursor-pointer"
              />
            </div>

            {/* Jumlah Tamu (Tampil jika kapasitas > 1) */}
            {maxOccupants > 1 ? (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-orange-500" /> Jumlah Tamu
                </label>
                <select
                  value={occupants}
                  onChange={(e) => setOccupants(parseInt(e.target.value))}
                  className="w-full bg-gray-50 border border-gray-200/90 rounded-xl px-3.5 py-2.5 text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 cursor-pointer"
                >
                  {Array.from({ length: maxOccupants }).map((_, idx) => {
                    const proportionalCostPerPerson = Math.round(
                      additionalCostPerPerson * (periodWeights[selectedPeriod] / (periodWeights[lowestPeriod] || 30))
                    );
                    return (
                      <option key={idx + 1} value={idx + 1}>
                        {idx + 1} Orang {idx > 0 && additionalCostPerPerson > 0 ? `(+${FORMAT_CURRENCY(proportionalCostPerPerson)})` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-gray-400" /> Kapasitas Kamar
                </label>
                <div className="w-full bg-gray-50/80 border border-gray-100 rounded-xl px-3.5 py-2.5 text-xs font-medium text-gray-500">
                  Maksimal 1 Orang (Single)
                </div>
              </div>
            )}
          </div>

          {/* Khusus Sewa Harian: Jam Operasional & Dropdown ETA */}
          {selectedPeriod === 'harian' && (
            <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/70 space-y-2.5 text-xs animate-in fade-in duration-200">
              <div className="flex items-center justify-between text-amber-950 font-bold">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-600" /> Aturan Sewa Harian
                </span>
                <span className="text-[10px] text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-full font-bold">
                  In 14:00 • Out 12:00
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-600">
                  Estimasi Jam Kedatangan (ETA):
                </label>
                <select
                  value={checkInEta}
                  onChange={(e) => setCheckInEta(e.target.value)}
                  className="w-full bg-white border border-amber-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 cursor-pointer"
                >
                  <option value="14:00 - 16:00 WIB (Normal Siang)">14:00 - 16:00 WIB (Normal Siang)</option>
                  <option value="16:00 - 18:00 WIB (Sore Hari)">16:00 - 18:00 WIB (Sore Hari)</option>
                  <option value="18:00 - 20:00 WIB (Malam Hari)">18:00 - 20:00 WIB (Malam Hari)</option>
                  <option value="Di atas 20:00 WIB (Konfirmasi Khusus Penjaga)">Di atas 20:00 WIB (Konfirmasi Khusus Penjaga)</option>
                </select>
                <p className="text-[9px] text-gray-400">
                  *Membantu pemilik mempersiapkan kamar saat Anda tiba.
                </p>
              </div>
            </div>
          )}

          {/* Ringkasan Jadwal Sewa (Check-in s/d Check-out) */}
          {leaseSchedule && (
            <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between text-xs animate-in fade-in duration-200">
              <div>
                <span className="text-[9.5px] text-gray-400 font-bold block uppercase tracking-wider">Check-in</span>
                <span className="font-bold text-gray-900 block">{leaseSchedule.formattedStart}</span>
                <span className="text-[10px] text-gray-500">{leaseSchedule.checkInTime}</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-gray-300 shrink-0" />
              <div className="text-right">
                <span className="text-[9.5px] text-gray-400 font-bold block uppercase tracking-wider">Check-out</span>
                <span className="font-bold text-gray-900 block">{leaseSchedule.formattedEnd}</span>
                <span className="text-[10px] text-gray-500">{leaseSchedule.checkOutTime}</span>
              </div>
            </div>
          )}

          {/* Rincian Harga Transparan */}
          <div className="space-y-1.5 pt-1 text-xs border-t border-gray-100">
            <div className="flex justify-between text-gray-600">
              <span>Sewa Kamar ({periodMapping[selectedPeriod]?.label})</span>
              <span className="font-bold text-gray-900">
                {FORMAT_CURRENCY(hasFlexiblePricing ? (variant.pricing?.find(p => p.period === selectedPeriod)?.price || 0) : (selectedPeriod === 'bulanan' ? variant.price : getPrice(selectedPeriod, 1)))}
              </span>
            </div>
            {occupants > 1 && additionalCostPerPerson > 0 && (
              <div className="flex justify-between text-orange-600">
                <span>Tambahan {occupants - 1} Orang</span>
                <span className="font-bold">
                  +{FORMAT_CURRENCY(Math.max(0, occupants - 1) * Math.round(additionalCostPerPerson * (periodWeights[selectedPeriod] / (periodWeights[lowestPeriod] || 30))))}
                </span>
              </div>
            )}
            {kost.additionalFeePrice > 0 && kost.additionalFeeStartsFrom !== 'month_2' && (
              <div className="flex justify-between text-blue-600">
                <span>{kost.additionalFeeName || 'Biaya Fasilitas Properti'}</span>
                <span className="font-bold">+{FORMAT_CURRENCY(kost.additionalFeePrice)}</span>
              </div>
            )}
          </div>

          {/* Garansi Keamanan Transaksi 100% */}
          <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100 flex items-center gap-2 text-[10px] font-semibold text-emerald-800">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Garansi uang kembali 100% jika kamar tidak sesuai atau dibatalkan oleh pemilik kost.</span>
          </div>
        </div>

        {/* Sticky Bottom Action Bar (Solusi Anti-Cutoff & Mudah Ditekan) */}
        <div className="p-4 sm:p-5 bg-white border-t border-gray-100 flex items-center justify-between gap-3 shrink-0 shadow-lg sm:shadow-none pb-safe sm:pb-5">
          <div>
            <span className="text-[9.5px] text-gray-400 font-bold block uppercase tracking-wider">
              Total Tagihan
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-black text-gray-900 leading-none">
                {FORMAT_CURRENCY(currentPrice)}
              </span>
              <span className="text-[10px] text-gray-400 font-bold">
                /{periodMapping[selectedPeriod]?.unitLabel || 'periode'}
              </span>
            </div>
          </div>

          <button 
            type="button"
            onClick={handleBooking}
            disabled={isSubmitting || !startDate}
            className={`px-5 sm:px-6 py-3.5 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-orange-500/25 active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none shrink-0`}
          >
            {isSubmitting ? (
              <span>Mengajukan...</span>
            ) : (
              <>
                <span>Ajukan Sewa</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default BookingModal;
