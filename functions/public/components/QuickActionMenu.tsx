import React from 'react';
import { Search, Database, ClipboardCheck, Store } from 'lucide-react';
import { Page } from '../types';

interface QuickActionMenuProps {
  onAction: (page: Page) => void;
}

const QuickActionMenu: React.FC<QuickActionMenuProps> = ({ onAction }) => {
  const actions = [
    {
      id: 'cari',
      label: 'CARI KOST',
      shortLabel: 'Cari Kost',
      icon: <Search className="w-6 h-6 md:w-7 md:h-7" strokeWidth={2.2} />,
      page: Page.LISTINGS,
      iconBg: 'bg-[#ffece0]',
      iconColor: 'text-[#ff7a00]',
    },
    {
      id: 'database',
      label: 'DATA KOST',
      shortLabel: 'Data Kost',
      icon: <Database className="w-6 h-6 md:w-7 md:h-7" strokeWidth={2.2} />,
      page: Page.PRODUCTS,
      iconBg: 'bg-[#e5eeff]',
      iconColor: 'text-[#3b82f6]',
    },
    {
      id: 'survey',
      label: 'JASA SURVEY',
      shortLabel: 'Jasa Survey',
      icon: <ClipboardCheck className="w-6 h-6 md:w-7 md:h-7" strokeWidth={2.2} />,
      page: Page.SURVEY_SERVICE,
      iconBg: 'bg-[#e0f2fe]',
      iconColor: 'text-[#0284c7]',
    },
    {
      id: 'mitra',
      label: 'JADI MITRA',
      shortLabel: 'Jadi Mitra',
      icon: <Store className="w-6 h-6 md:w-7 md:h-7" strokeWidth={2.2} />,
      page: Page.OWNER,
      iconBg: 'bg-[#f3e8ff]',
      iconColor: 'text-[#8b5cf6]',
    },
  ];

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-5 md:mt-8 mb-6 md:mb-10 flex flex-col items-center">
      {/* Section Indicator */}
      <div className="flex items-center gap-2 mb-3 md:mb-6 self-start md:self-center">
        <span className="w-1.5 h-1.5 rounded-full bg-[#ff7a00]"></span>
        <h2 className="text-[10px] md:text-xs font-black text-[#8c7263] uppercase tracking-widest">
          MENU UTAMA & FITUR
        </h2>
      </div>

      {/* MOBILE: Single Compact White Card with 4 Columns in 1 Row */}
      <div className="md:hidden w-full bg-white rounded-2xl p-3.5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100/80">
        <div className="grid grid-cols-4 gap-1">
          {actions.map((action) => (
            <button
              key={action.id}
              onClick={() => onAction(action.page)}
              className="flex flex-col items-center justify-center text-center cursor-pointer group active:scale-95 transition-transform"
            >
              <div className={`w-12 h-12 rounded-2xl ${action.iconBg} ${action.iconColor} flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform mb-1.5 shrink-0`}>
                {action.icon}
              </div>
              <span className="text-[11px] font-bold text-[#0b1c30] group-hover:text-[#ff7a00] transition-colors leading-tight">
                {action.shortLabel}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* DESKTOP: 4 Standalone Cards Grid */}
      <div className="hidden md:grid md:grid-cols-4 gap-6 w-full max-w-5xl mx-auto">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={() => onAction(action.page)}
            className="bg-white rounded-2xl p-6 flex flex-col items-center justify-center gap-3 shadow-[0_4px_20px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all duration-300 transform hover:-translate-y-1 border border-gray-100/80 cursor-pointer group active:scale-[0.98] w-full"
          >
            <div className={`w-16 h-16 rounded-full ${action.iconBg} ${action.iconColor} flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform duration-300 shrink-0`}>
              {action.icon}
            </div>
            <div className="text-center">
              <h3 className="text-sm font-black text-[#0b1c30] group-hover:text-[#ff7a00] transition-colors uppercase tracking-tight">
                {action.label}
              </h3>
              <span className="text-[9px] text-[#8c7263] font-extrabold uppercase tracking-wider block mt-1 opacity-75 group-hover:opacity-100 transition-opacity">
                KLIK DISINI ›
              </span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};

export default QuickActionMenu;
