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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-5 mb-10">
      <div className="bg-white rounded-3xl lg:rounded-[2.5rem] p-4 lg:p-3 shadow-md border border-gray-100/50">
        <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 lg:mb-3 lg:ml-4 flex items-center gap-2">
          <span className="h-1 w-1 bg-orange-500 rounded-full"></span>
          Menu Utama & Fitur
        </h2>
        <div className="grid grid-cols-4 gap-3 lg:gap-4 px-1">
          {actions.map((action) => (
            <button
              key={action.id}
              onClick={() => onAction(action.page)}
              className="flex flex-col lg:flex-row items-center group gap-2 lg:gap-3 transition-all active:scale-[0.97] bg-white lg:bg-gray-50/40 hover:bg-white p-2.5 lg:px-4 lg:py-3 rounded-2xl lg:rounded-2xl border border-gray-100 hover:border-orange-500/40 hover:shadow-xl hover:shadow-orange-500/10 lg:w-full"
            >
              <div className={`p-3 lg:p-2.5 rounded-xl lg:rounded-xl ${action.color} shadow-sm group-hover:shadow-md group-hover:scale-110 transition-all duration-300`}>
                {React.cloneElement(action.icon as React.ReactElement, { className: "w-5 h-5 sm:w-6 sm:h-6 lg:w-4.5 lg:h-4.5" })}
              </div>
              <div className="flex flex-col text-center lg:text-left">
                <span className="text-[10px] lg:text-[12px] font-black text-gray-800 uppercase tracking-tight group-hover:text-orange-500 transition-colors leading-tight">
                  {action.label}
                </span>
                <span className="hidden lg:block text-[8px] text-gray-400 font-bold uppercase tracking-widest mt-1 opacity-60 group-hover:opacity-100 transition-opacity">
                  Klik Disini &rsaquo;
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuickActionMenu;
