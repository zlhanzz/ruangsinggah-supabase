import React from 'react';
import { Page } from '../types';

interface FooterProps {
  onPageChange: (page: Page) => void;
}

const Footer: React.FC<FooterProps> = ({ onPageChange }) => {
  return (
    <footer className="bg-white pt-14 pb-12 border-t border-gray-100/90 text-[#0b1c30]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-10 items-start">
          
          {/* Brand & Description Column (Left) */}
          <div className="md:col-span-4 flex flex-col justify-between h-full">
            <div>
              <div 
                className="flex items-center gap-2 mb-4 cursor-pointer w-fit"
                onClick={() => onPageChange(Page.HOME)}
              >
                <img src="/logo.png" alt="RuangSinggah.id" className="h-8 w-auto" />
                <span className="text-xl font-extrabold text-[#ff7a00] tracking-tight">
                  RuangSinggah<span className="text-[#0b1c30]">.id</span>
                </span>
              </div>
              <p className="text-xs text-[#584235] leading-relaxed max-w-sm">
                Platform pencarian dan sewa properti terpercaya se-Indonesia.
              </p>
            </div>
            
            <p className="text-[11px] text-[#8c7263] mt-8 md:mt-12">
              © 2024 RuangSinggah.id. Solusi properti terpercaya.
            </p>
          </div>

          {/* Layanan Column */}
          <div className="md:col-span-2">
            <h4 className="text-xs font-black uppercase text-[#0b1c30] tracking-wider mb-4">
              LAYANAN
            </h4>
            <ul className="space-y-3 text-xs text-[#584235]">
              <li>
                <button 
                  onClick={() => onPageChange(Page.LISTINGS)} 
                  className="hover:text-[#ff7a00] hover:underline underline-offset-4 transition-colors cursor-pointer text-left"
                >
                  Pencarian Kost Mitra
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onPageChange(Page.PRODUCTS)} 
                  className="hover:text-[#ff7a00] hover:underline underline-offset-4 transition-colors cursor-pointer text-left"
                >
                  Database Kost Kampus
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onPageChange(Page.SURVEY_SERVICE)} 
                  className="hover:text-[#ff7a00] hover:underline underline-offset-4 transition-colors cursor-pointer text-left"
                >
                  Jasa Survey Kost
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onPageChange(Page.OWNER)} 
                  className="hover:text-[#ff7a00] hover:underline underline-offset-4 transition-colors cursor-pointer text-left"
                >
                  Gabung Jadi Mitra
                </button>
              </li>
            </ul>
          </div>

          {/* Perusahaan Column */}
          <div className="md:col-span-2">
            <h4 className="text-xs font-black uppercase text-[#0b1c30] tracking-wider mb-4">
              PERUSAHAAN
            </h4>
            <ul className="space-y-3 text-xs text-[#584235]">
              <li>
                <button 
                  onClick={() => onPageChange(Page.ABOUT)} 
                  className="hover:text-[#ff7a00] hover:underline underline-offset-4 transition-colors cursor-pointer text-left"
                >
                  Tentang Kami
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onPageChange(Page.CONTACT)} 
                  className="hover:text-[#ff7a00] hover:underline underline-offset-4 transition-colors cursor-pointer text-left"
                >
                  Kontak
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onPageChange(Page.TERMS)} 
                  className="hover:text-[#ff7a00] hover:underline underline-offset-4 transition-colors cursor-pointer text-left"
                >
                  Syarat & Ketentuan
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onPageChange(Page.TERMS)} 
                  className="hover:text-[#ff7a00] hover:underline underline-offset-4 transition-colors cursor-pointer text-left"
                >
                  Kebijakan Privasi
                </button>
              </li>
            </ul>
          </div>

          {/* Ikuti Kami & Afiliasi Media Sosial Column (Right) */}
          <div className="md:col-span-4">
            <h4 className="text-xs font-black uppercase text-[#0b1c30] tracking-wider mb-4">
              IKUTI KAMI
            </h4>
            
            <div className="space-y-4">
              {/* 1. Platform Utama */}
              <div>
                <p className="text-[9px] font-extrabold uppercase text-[#8c7263] tracking-widest mb-2">
                  Platform Utama
                </p>
                <div className="flex items-center gap-2">
                  <a 
                    href="https://www.instagram.com/ruangsinggahid" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="w-8 h-8 rounded-full bg-[#eff4ff] flex items-center justify-center text-[#0b1c30] hover:bg-[#ffece0] hover:text-[#ff7a00] hover:scale-105 transition-all shadow-2xs"
                    title="Instagram @ruangsinggahid"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                  </a>
                  <a 
                    href="https://www.facebook.com/profile.php?id=61572134009904" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="w-8 h-8 rounded-full bg-[#eff4ff] flex items-center justify-center text-[#0b1c30] hover:bg-[#ffece0] hover:text-[#ff7a00] hover:scale-105 transition-all shadow-2xs"
                    title="Facebook RuangSinggah.id"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  </a>
                </div>
              </div>

              {/* 2. Pemasaran Kost */}
              <div>
                <p className="text-[9px] font-extrabold uppercase text-[#8c7263] tracking-widest mb-2">
                  Pemasaran Kost
                </p>
                <div className="flex items-center gap-2">
                  <a 
                    href="https://www.instagram.com/cari_kost_makassar/" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="w-8 h-8 rounded-full bg-[#eff4ff] flex items-center justify-center text-[#0b1c30] hover:bg-[#ffece0] hover:text-[#ff7a00] hover:scale-105 transition-all shadow-2xs"
                    title="Instagram @cari_kost_makassar"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                  </a>
                  <a 
                    href="https://www.tiktok.com/@cari.kost.makassa" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="w-8 h-8 rounded-full bg-[#eff4ff] flex items-center justify-center text-[#0b1c30] hover:bg-[#ffece0] hover:text-[#ff7a00] hover:scale-105 transition-all shadow-2xs"
                    title="TikTok @cari.kost.makassa"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.89-.6-4.13-1.47-.12 3.35-.12 6.7 0 10.05-.1 1.63-.58 3.25-1.55 4.58-1.35 1.83-3.67 2.87-5.91 2.8-2.31-.01-4.6-.96-6.11-2.72-1.78-2.03-2.22-5.06-1.12-7.53.94-2.18 3.09-3.79 5.46-4.06.13 1.34.25 2.68.38 4.02-1.15.11-2.32.55-3.08 1.46-.73.91-.91 2.14-.52 3.24.4 1.15 1.43 2.03 2.62 2.23 1.28.2 2.64-.19 3.52-1.12.82-.9.99-2.19.98-3.37-.02-3.34-.02-6.67-.02-10.01V0c.01.01.01.01 0 .02z"/></svg>
                  </a>
                  <a 
                    href="https://www.facebook.com/profile.php?id=61574949063138" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="w-8 h-8 rounded-full bg-[#eff4ff] flex items-center justify-center text-[#0b1c30] hover:bg-[#ffece0] hover:text-[#ff7a00] hover:scale-105 transition-all shadow-2xs"
                    title="Facebook Pemasaran Kost"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  </a>
                </div>
              </div>

              {/* 3. Info Villa */}
              <div>
                <p className="text-[9px] font-extrabold uppercase text-[#8c7263] tracking-widest mb-2">
                  Info Villa
                </p>
                <div className="flex items-center gap-2">
                  <a 
                    href="https://www.instagram.com/cari_villa_sulawesi/" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="w-8 h-8 rounded-full bg-[#eff4ff] flex items-center justify-center text-[#0b1c30] hover:bg-[#ffece0] hover:text-[#ff7a00] hover:scale-105 transition-all shadow-2xs"
                    title="Instagram @cari_villa_sulawesi"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                  </a>
                  <a 
                    href="https://www.tiktok.com/@cari.villa.sulawe" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="w-8 h-8 rounded-full bg-[#eff4ff] flex items-center justify-center text-[#0b1c30] hover:bg-[#ffece0] hover:text-[#ff7a00] hover:scale-105 transition-all shadow-2xs"
                    title="TikTok @cari.villa.sulawe"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.89-.6-4.13-1.47-.12 3.35-.12 6.7 0 10.05-.1 1.63-.58 3.25-1.55 4.58-1.35 1.83-3.67 2.87-5.91 2.8-2.31-.01-4.6-.96-6.11-2.72-1.78-2.03-2.22-5.06-1.12-7.53.94-2.18 3.09-3.79 5.46-4.06.13 1.34.25 2.68.38 4.02-1.15.11-2.32.55-3.08 1.46-.73.91-.91 2.14-.52 3.24.4 1.15 1.43 2.03 2.62 2.23 1.28.2 2.64-.19 3.52-1.12.82-.9.99-2.19.98-3.37-.02-3.34-.02-6.67-.02-10.01V0c.01.01.01.01 0 .02z"/></svg>
                  </a>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </footer>
  );
};

export default Footer;
