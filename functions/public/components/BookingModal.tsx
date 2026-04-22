
import React, { useState } from 'react';
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
  const additionalCostPerPerson = variant.additionalCostPerPerson || 0;
  const hasFlexiblePricing = variant.pricing && variant.pricing.length > 0;
  
  const [occupants, setOccupants] = useState<number>(1);
  
  const [selectedPeriod, setSelectedPeriod] = useState<PricingPeriod>(initialPeriod || (hasFlexiblePricing ? variant.pricing![0].period : 'bulanan'));
  const [startDate, setStartDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const periodWeights: Record<string, number> = {
      'harian': 1,
      'mingguan': 7,
      'bulanan': 30,
      '3bulanan': 90,
      '6bulanan': 180,
      'tahunan': 360,
  };

  // Determine available options
  const availableOptions = hasFlexiblePricing 
    ? variant.pricing!.map(p => p.period)
    : ['bulanan', '3bulanan', '6bulanan', 'tahunan'];

  // Find lowest active period
  const lowestPeriod = availableOptions.reduce((min, p) => 
      periodWeights[p] < periodWeights[min] ? p : min
  , availableOptions[0]);


  // Helper to map backend periods to display logic
  const periodMapping: Record<string, { label: string, months: number }> = {
      'harian': { label: 'Harian', months: 0 }, // Special handling for days? keeping simple for now
      'mingguan': { label: 'Mingguan', months: 0 },
      'bulanan': { label: 'Bulanan', months: 1 },
      '3bulanan': { label: '3 Bulan', months: 3 },
      '6bulanan': { label: '6 Bulan', months: 6 },
      'tahunan': { label: 'Tahunan', months: 12 },
  };

  const getPrice = (period: PricingPeriod, occupantsCount: number) => {
      let basePrice = 0;
      if (hasFlexiblePricing) {
          const scheme = variant.pricing?.find(p => p.period === period);
          basePrice = scheme ? scheme.price : 0;
      } else {
          // Fallback legacy calculation
          const base = variant.price;
          if (period === 'bulanan') basePrice = base;
          else if (period === '3bulanan') basePrice = base * 3 * 0.95;
          else if (period === '6bulanan') basePrice = base * 6 * 0.90;
          else if (period === 'tahunan') basePrice = base * 12 * 0.85;
      }
      
      const extraCostBase = additionalCostPerPerson;
      
      const selectedWeight = periodWeights[period] || 30;
      const lowestWeight = periodWeights[lowestPeriod] || 30;
      const proportion = selectedWeight / lowestWeight;
      
      const totalExtraCost = Math.max(0, occupantsCount - 1) * Math.round(extraCostBase * proportion);

      // Add property-wide additional fee if starting from month 1
      let propertyAddFee = 0;
      if (kost.additionalFeePrice && kost.additionalFeePrice > 0 && kost.additionalFeeStartsFrom !== 'month_2') {
          // Proportionally calculate additional fee based on the period (assuming additionalFeePrice is monthly)
          const monthlyWeight = 30;
          propertyAddFee = Math.round(kost.additionalFeePrice * (selectedWeight / monthlyWeight));
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
          basePrice = scheme ? scheme.price : 0;
      } else {
          const base = variant.price;
          if (selectedPeriod === 'bulanan') basePrice = base;
          else if (selectedPeriod === '3bulanan') basePrice = base * 3 * 0.95;
          else if (selectedPeriod === '6bulanan') basePrice = base * 6 * 0.90;
          else if (selectedPeriod === 'tahunan') basePrice = base * 12 * 0.85;
      }

      const extraPersonFee = Math.max(0, occupants - 1) * Math.round(additionalCostPerPerson * proportion);
      
      let facilityFee = 0;
      if (kost.additionalFeePrice && kost.additionalFeePrice > 0) {
          // Note: Facility fee is always proportional to the period here for the INITIAL payment
          facilityFee = Math.round(kost.additionalFeePrice * (selectedWeight / 30));
          if (kost.additionalFeeStartsFrom === 'month_2') {
              facilityFee = 0; // Promo free month 1
          }
      }

      onConfirm({
        period: selectedPeriod,
        startDate,
        total: currentPrice,
        variantName: variant.name,
        occupants: occupants,
        basePrice,
        extraPersonFee,
        facilityFee
      });
      setIsSubmitting(false);
    }, 1500);
  };

  // Move to top to be used earlier, removed from here

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b border-gray-50 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight leading-none mb-1">Ajukan Sewa Kost</h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{kost.title} • {variant.name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-8 space-y-8 overflow-y-auto max-h-[70vh]">
          {/* Durasi Sewa */}
          <div className="space-y-4">
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Pilih Paket Sewa</label>
            <div className="grid grid-cols-2 gap-3">
              {availableOptions.map((periodKey) => {
                  const pKey = periodKey as PricingPeriod;
                  const price = getPrice(pKey, occupants);
                  return (
                    <button
                    key={pKey}
                    onClick={() => setSelectedPeriod(pKey)}
                    className={`p-4 rounded-2xl border-2 text-left transition-all relative ${
                        selectedPeriod === pKey 
                        ? 'border-orange-500 bg-orange-50 shadow-lg shadow-orange-100' 
                        : 'border-gray-100 hover:border-gray-200'
                    }`}
                    >
                    <p className={`text-sm font-black uppercase tracking-tight ${selectedPeriod === pKey ? 'text-orange-600' : 'text-gray-900'}`}>
                        {periodMapping[pKey]?.label || pKey}
                    </p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{FORMAT_CURRENCY(price)}</p>
                    </button>
                  );
              })}
            </div>
          </div>

          {/* Jumlah Penghuni */}
          {maxOccupants > 1 && (
            <div className="space-y-4">
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Jumlah Penghuni</label>
              <div className="relative">
                <select
                  value={occupants}
                  onChange={(e) => setOccupants(parseInt(e.target.value))}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all appearance-none cursor-pointer"
                >
                  {Array.from({ length: maxOccupants }).map((_, idx) => {
                    const proportionalCostPerPerson = Math.round(additionalCostPerPerson * (periodWeights[selectedPeriod] / (periodWeights[lowestPeriod] || 30)));
                    return (
                        <option key={idx + 1} value={idx + 1}>
                        {idx + 1} Orang {idx > 0 && additionalCostPerPerson > 0 ? `(+${FORMAT_CURRENCY(proportionalCostPerPerson)} untuk ${periodMapping[selectedPeriod]?.label})` : ''}
                        </option>
                    );
                  })}
                </select>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>
          )}

          {/* Tanggal Masuk */}
          <div className="space-y-4">
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Pilih Tanggal Masuk</label>
            <div className="relative">
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all appearance-none"
              />
              <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
            </div>
            <p className="text-[10px] text-orange-500 font-bold italic">*Pastikan tanggal masuk sesuai dengan kesiapan Anda.</p>
          </div>

          {/* Rincian Harga */}
          <div className="bg-gray-50 rounded-[2.5rem] p-8 space-y-4 border border-gray-100">
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs font-bold text-gray-500 uppercase tracking-widest">
                <span>Harga Sewa Dasar ({periodMapping[selectedPeriod]?.label || selectedPeriod})</span>
                <span className="text-gray-900">{FORMAT_CURRENCY(hasFlexiblePricing ? (variant.pricing?.find(p => p.period === selectedPeriod)?.price || 0) : (selectedPeriod === 'bulanan' ? variant.price : getPrice(selectedPeriod, 1)))}</span>
              </div>
              
              {occupants > 1 && additionalCostPerPerson > 0 && (
                <div className="flex justify-between items-center text-xs font-bold text-orange-500 uppercase tracking-widest">
                  <span>Tambahan {occupants - 1} Orang</span>
                  <span>+{FORMAT_CURRENCY(Math.max(0, occupants - 1) * Math.round(additionalCostPerPerson * (periodWeights[selectedPeriod] / (periodWeights[lowestPeriod] || 30))))}</span>
                </div>
              )}

              {kost.additionalFeePrice > 0 && kost.additionalFeeStartsFrom !== 'month_2' && (
                <div className="flex justify-between items-center text-xs font-bold text-blue-500 uppercase tracking-widest">
                  <span>{kost.additionalFeeName || 'Biaya Tambahan Properti'}</span>
                  <span>+{FORMAT_CURRENCY(Math.round(kost.additionalFeePrice * (periodWeights[selectedPeriod] / 30)))}</span>
                </div>
              )}
            </div>

            <div className="h-px bg-gray-200"></div>

            <div className="flex justify-between items-end pt-2">
              <div>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Total Pembayaran Pertama</p>
                <p className="text-3xl font-black text-gray-900 tracking-tighter leading-none">{FORMAT_CURRENCY(currentPrice)}</p>
                {kost.additionalFeeStartsFrom === 'month_2' && (
                   <p className="text-[9px] text-green-600 font-bold mt-2">✨ Promo: {kost.additionalFeeName || 'Biaya Tambahan'} Gratis di Bulan Pertama</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest leading-none mb-1">Status</p>
                <p className="text-[10px] text-orange-500 font-black uppercase tracking-widest">Menunggu Persetujuan</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 bg-gray-50/50 border-t border-gray-50">
          <button 
            onClick={handleBooking}
            disabled={isSubmitting}
            className={`w-full bg-orange-500 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-orange-100 flex items-center justify-center gap-3 transition-all active:scale-95 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-orange-600'}`}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Mengajukan Sewa...
              </>
            ) : (
              'Ajukan Sewa Sekarang'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
