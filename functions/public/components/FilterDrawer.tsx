import React from 'react';
import FilterControls, { FilterState } from './FilterControls';
import { GeoRelationEntry } from '../userService';

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: () => void;
  filters: FilterState;
  setFilters: (filters: Partial<FilterState>) => void;
  onReset: () => void;
  availableProvinces?: string[];
  availableCities: string[];
  availableDistricts?: string[];
  availableCampuses: string[];
  rawRelations?: GeoRelationEntry[];
}

const FilterDrawer: React.FC<FilterDrawerProps> = ({ 
  isOpen, 
  onClose, 
  onApply, 
  filters,
  setFilters,
  onReset,
  availableProvinces = [],
  availableCities,
  availableDistricts = [],
  availableCampuses,
  rawRelations = []
}) => {
  if (!isOpen) return null;

  return (
    <div className="lg:hidden fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4 font-sans">
      <div 
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-xs animate-in fade-in duration-300" 
        onClick={onClose}
      ></div>
      <div className="relative bg-white w-full sm:max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl p-6 pb-8 animate-in slide-in-from-bottom duration-500 max-h-[90vh] overflow-y-auto">
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6 sm:hidden"></div>
        
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight text-gray-900">Filter Pencarian</h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Temukan kost impianmu</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors cursor-pointer">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <FilterControls 
          filters={filters}
          setFilters={setFilters}
          availableProvinces={availableProvinces}
          availableCities={availableCities}
          availableDistricts={availableDistricts}
          availableCampuses={availableCampuses}
          rawRelations={rawRelations}
          onReset={onReset}
          onApply={onApply}
          showApplyButton={true}
        />
      </div>
    </div>
  );
};

export default FilterDrawer;
