import React from 'react';
import { FORMAT_CURRENCY } from '../constants';
import { Filter, RotateCcw, Check } from 'lucide-react';

export interface FilterState {
  searchTerm: string;
  typeFilter: string;
  selectedProvince: string;
  selectedCity: string;
  selectedDistrict: string;
  selectedCampus: string;
  maxPrice: number;
}

interface FilterControlsProps {
  filters: FilterState;
  setFilters: (filters: Partial<FilterState>) => void;
  availableProvinces?: string[];
  availableCities: string[];
  availableDistricts?: string[];
  availableCampuses: string[];
  onReset: () => void;
  onApply?: () => void;
  showApplyButton?: boolean;
}

const FilterControls: React.FC<FilterControlsProps> = ({ 
  filters, 
  setFilters, 
  availableProvinces = [],
  availableCities = [],
  availableDistricts = [],
  availableCampuses = [],
  onReset,
  onApply,
  showApplyButton = true
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onApply) {
      onApply();
    }
  };

  return (
    <div className="space-y-4 lg:space-y-5 font-sans">
      {/* Pencarian */}
      <div className="space-y-1.5">
        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest">Pencarian</label>
        <input 
          type="text" 
          placeholder="Nama kost atau daerah..." 
          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-gray-900 placeholder:text-gray-400 transition-all" 
          value={filters.searchTerm} 
          onChange={(e) => setFilters({ searchTerm: e.target.value })} 
          onKeyDown={handleKeyDown}
        />
      </div>

      {/* Tipe Kost */}
      <div className="space-y-1.5">
        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest">Tipe Kost</label>
        <select 
          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/20 appearance-none text-gray-900 cursor-pointer transition-all"
          value={filters.typeFilter}
          onChange={(e) => setFilters({ typeFilter: e.target.value })}
        >
          <option value="Semua">Semua Tipe</option>
          <option value="Putra">Kost Putra</option>
          <option value="Putri">Kost Putri</option>
          <option value="Campur">Kost Campur</option>
        </select>
      </div>

      {/* Pilih Provinsi */}
      <div className="space-y-1.5">
        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest">Pilih Provinsi</label>
        <select 
          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/20 appearance-none text-gray-900 cursor-pointer transition-all" 
          value={filters.selectedProvince || 'Semua'} 
          onChange={(e) => setFilters({ selectedProvince: e.target.value })}
        >
          <option value="Semua">Semua Provinsi</option>
          {availableProvinces.map(prov => (
            <option key={prov} value={prov}>{prov}</option>
          ))}
        </select>
      </div>

      {/* Pilih Kota */}
      <div className="space-y-1.5">
        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest">Pilih Kota</label>
        <select 
          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/20 appearance-none text-gray-900 cursor-pointer transition-all" 
          value={filters.selectedCity} 
          onChange={(e) => setFilters({ selectedCity: e.target.value })}
        >
          <option value="Semua">Semua Kota</option>
          {availableCities.map(city => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>
      </div>

      {/* Pilih Kecamatan / Area */}
      <div className="space-y-1.5">
        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest">Pilih Kecamatan / Area</label>
        <select 
          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/20 appearance-none text-gray-900 cursor-pointer transition-all disabled:bg-gray-50 disabled:text-gray-400" 
          value={filters.selectedDistrict || 'Semua'} 
          onChange={(e) => setFilters({ selectedDistrict: e.target.value })}
        >
          <option value="Semua">Semua Kecamatan</option>
          {availableDistricts.map(district => (
            <option key={district} value={district}>{district}</option>
          ))}
        </select>
      </div>

      {/* Pilih Kampus */}
      <div className="space-y-1.5">
        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest">Pilih Kampus</label>
        <select 
          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/20 appearance-none text-gray-900 disabled:bg-gray-50 disabled:text-gray-400 cursor-pointer transition-all"
          value={filters.selectedCampus}
          onChange={(e) => setFilters({ selectedCampus: e.target.value })}
        >
          <option value="Semua">Semua Kampus</option>
          {availableCampuses.map(campus => (
            <option key={campus} value={campus}>{campus}</option>
          ))}
        </select>
      </div>

      {/* Harga Maksimal Slider */}
      <div className="space-y-2.5 pt-1">
        <div className="flex justify-between items-center">
          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest">Harga Maksimal</label>
          <span className="text-[#ff7a00] font-black text-[11px] uppercase">{FORMAT_CURRENCY(filters.maxPrice)}</span>
        </div>
        <input 
          type="range" 
          min="500000" 
          max="5000000" 
          step="100000" 
          className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#ff7a00]" 
          value={filters.maxPrice} 
          onChange={(e) => setFilters({ maxPrice: parseInt(e.target.value) })} 
        />
        <div className="flex justify-between text-[8px] font-bold text-gray-400 uppercase tracking-widest">
          <span>500rb</span>
          <span>5jt</span>
        </div>
      </div>

      {/* Action Buttons: TERAPKAN & RESET */}
      <div className="pt-3 space-y-2">
        {showApplyButton && onApply && (
          <button 
            type="button"
            onClick={onApply}
            className="w-full py-3 bg-[#ff7a00] hover:bg-orange-600 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md shadow-orange-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Filter className="w-3.5 h-3.5" />
            Terapkan Filter
          </button>
        )}
        
        <button 
          type="button"
          onClick={onReset} 
          className="w-full py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider hover:text-gray-900 border border-gray-200 bg-white hover:bg-gray-50 rounded-xl transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <RotateCcw className="w-3 h-3 text-gray-400" />
          Reset Filter
        </button>
      </div>
    </div>
  );
};

export default FilterControls;
