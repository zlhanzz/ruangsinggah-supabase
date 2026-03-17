import React, { useState, useEffect, useRef } from 'react';
import { FORMAT_CURRENCY } from '../constants';

interface InvoiceModalProps {
  productName: string;
  price: number;
  userName: string;
  userEmail: string;
  userId: string;
  productId: string;
  productType: string;
  onProceedToPayment: (orderId?: string) => void;
  onCancel: () => void;
}

const InvoiceModal: React.FC<InvoiceModalProps> = ({
  productName,
  price,
  userName,
  userEmail,
  userId,
  productId,
  productType,
  onProceedToPayment,
  onCancel,
}) => {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onCancel}></div>
      <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl p-6 sm:p-8 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-6">
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">INVOICE PREVIEW</h2>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mt-1">RuangSinggah.id</p>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 p-2 rounded-full transition-colors hidden sm:block">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6">
          <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Informasi Tagihan</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Nama Lengkap</span>
                <span className="text-sm font-bold text-gray-900">{userName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Email Tujuan</span>
                <span className="text-sm font-bold text-gray-900">{userEmail}</span>
              </div>
              <div className="h-px bg-gray-200 my-2"></div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Produk</span>
                <span className="text-sm font-bold text-gray-900 text-right">{productName}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-end px-2">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Tagihan</p>
              <p className="text-3xl font-black text-orange-500 tracking-tighter mt-1">{FORMAT_CURRENCY(price)}</p>
            </div>
          </div>

        </div>

        {/* Action */}
        <div className="mt-8">
          <button
            onClick={() => onProceedToPayment()}
            className="w-full py-4 rounded-xl font-black text-xs sm:text-sm uppercase tracking-widest transition-all bg-gray-900 text-white shadow-xl shadow-gray-200 hover:bg-orange-500 active:scale-95"
          >
            Lanjut ke Pembayaran
          </button>
          
          <button onClick={onCancel} className="w-full mt-3 py-3 text-xs font-bold text-gray-500 uppercase tracking-widest hover:text-gray-900 transition-colors sm:hidden">
            Batal
          </button>
        </div>

      </div>
    </div>
  );
};

export default InvoiceModal;
