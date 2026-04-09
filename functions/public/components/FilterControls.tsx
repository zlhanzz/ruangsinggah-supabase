import React, { useMemo } from 'react';
import { FORMAT_CURRENCY } from '../constants';

export interface FilterState {
  searchTerm: string;
  typeFilter: string;
  selectedCity: string;
  selectedCampus: string;
  maxPrice: number;
}

interface FilterControlsProps {
  filters: FilterState;
  setFilters: (filters: Partial<FilterState>) => void;
  availableCities: string[];
  availableCampuses: string[];
  onReset: () => void;
  onApply?: () => void; // Optional for desktop
  showApplyButton?: boolean;
}

const FilterControls: React.FC<FilterControlsProps> = ({ 
  filters, 
  setFilters, 
  availableCities, 
  availableCampuses,
  onReset,
  onApply,
  showApplyButton = true
}) => {
  return (
    <div className="space-y-5 lg:space-y-6">
      {/* Pencarian */}
      <div className="space-y-1.5">
        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest">Pencarian</label>
        <input 
          type="text" 
          placeholder="Nama kost atau daerah..." 
          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-gray-900 placeholder:text-gray-400" 
          value={filters.searchTerm} 
          onChange={(e) => setFilters({ searchTerm: e.target.value })} 
        />
      </div>

      {/* Tipe Kost */}
      <div className="space-y-1.5">
        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest">Tipe Kost</label>
        <select 
          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/20 appearance-none text-gray-900 cursor-pointer"
          value={filters.typeFilter}
          onChange={(e) => setFilters({ typeFilter: e.target.value })}
        >
          <option value="Semua">Semua Tipe</option>
          <option value="Putra">Kost Putra</option>
          <option value="Putri">Kost Putri</option>
          <option value="Campur">Kost Campur</option>
        </select>
      </div>

      {/* Pilih Kota */}
      <div className="space-y-1.5">
        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest">Pilih Kota</label>
        <select 
          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/20 appearance-none text-gray-900 cursor-pointer" 
          value={filters.selectedCity} 
          onChange={(e) => setFilters({ selectedCity: e.target.value, selectedCampus: 'Semua' })}
        >
          <option value="Semua">Semua Kota</option>
          {availableCities.map(city => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>
      </div>

      {/* Pilih Kampus */}
      <div className="space-y-1.5">
        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest">Pilih Kampus</label>
        <select 
          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/20 appearance-none text-gray-900 disabled:bg-gray-50 disabled:text-gray-400 cursor-pointer"
          value={filters.selectedCampus}
          onChange={(e) => setFilters({ selectedCampus: e.target.value })}
          disabled={availableCampuses.length === 0}
        >
          <option value="Semua">Semua Kampus</option>
          {availableCampuses.map(campus => (
            <option key={campus} value={campus}>{campus}</option>
          ))}
        </select>
      </div>

      {/* Harga Maksimal Slider */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest">Harga Maksimal</label>
          <span className="text-orange-600 font-black text-[10px] uppercase">{FORMAT_CURRENCY(filters.maxPrice)}</span>
        </div>
        <input 
          type="range" 
          min="500000" 
          max="5000000" 
          step="100000" 
          className="w-full h-1.5 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-orange-500" 
          value={filters.maxPrice} 
          onChange={(e) => setFilters({ maxPrice: parseInt(e.target.value) })} 
        />
        <div className="flex justify-between text-[8px] font-bold text-gray-400 uppercase tracking-widest">
          <span>500rb</span>
          <span>5jt</span>
        </div>
      </div>

      <div className="pt-4 flex gap-3">
        <button 
          onClick={onReset} 
          className="flex-1 py-3 text-[9px] font-black text-gray-500 uppercase tracking-widest hover:text-orange-500 border border-gray-200 bg-white rounded-xl transition-colors shadow-sm"
        >
          Reset
        </button>
        {showApplyButton && onApply && (
          <button 
            onClick={onApply}
            className="flex-[2] bg-gray-900 text-white py-3 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl active:scale-95"
          >
            Terapkan
          </button>
        )}
      </div>
    </div>
  );
};

export default FilterControls;
