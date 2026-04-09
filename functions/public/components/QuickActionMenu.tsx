import React from 'react';
import { Search, Database, ClipboardCheck, Home as HomeIcon } from 'lucide-react';
import { Page } from '../types';

interface QuickActionMenuProps {
  onAction: (page: Page) => void;
}

const QuickActionMenu: React.FC<QuickActionMenuProps> = ({ onAction }) => {
  const actions = [
    {
      id: 'cari',
      label: 'Cari Kost',
      icon: <Search className="w-6 h-6 sm:w-8 sm:h-8" />,
      page: Page.LISTINGS,
      color: 'bg-orange-100 text-orange-600',
    },
    {
      id: 'database',
      label: 'Data Kost',
      icon: <Database className="w-6 h-6 sm:w-8 sm:h-8" />,
      page: Page.PRODUCTS,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      id: 'survey',
      label: 'Jasa Survey',
      icon: <ClipboardCheck className="w-6 h-6 sm:w-8 sm:h-8" />,
      page: Page.SURVEY_SERVICE,
      color: 'bg-green-100 text-green-600',
    },
    {
      id: 'mitra',
      label: 'Jadi Mitra',
      icon: <HomeIcon className="w-6 h-6 sm:w-8 sm:h-8" />,
      page: Page.OWNER,
      color: 'bg-purple-100 text-purple-600',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 mb-12">
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100">
        <h2 className="text-xs sm:text-sm font-black uppercase tracking-widest text-gray-400 mb-6 sm:mb-8">
          Menu Utama & Fitur
        </h2>
        <div className="grid grid-cols-4 gap-4 sm:gap-8 lg:gap-12">
          {actions.map((action) => (
            <button
              key={action.id}
              onClick={() => onAction(action.page)}
              className="flex flex-col items-center group gap-3 sm:gap-4 transition-all active:scale-90"
            >
              <div className={`p-4 sm:p-6 rounded-2xl sm:rounded-3xl ${action.color} group-hover:shadow-lg transition-all group-hover:-translate-y-1`}>
                {action.icon}
              </div>
              <span className="text-[10px] sm:text-sm font-black text-gray-700 uppercase tracking-tight sm:tracking-normal group-hover:text-orange-500 transition-colors text-center leading-tight">
                {action.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuickActionMenu;
