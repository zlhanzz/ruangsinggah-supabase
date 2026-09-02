
import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Kost, RoomType, PricingPeriod, Page } from '../types';
import { FORMAT_CURRENCY } from '../constants';
import BookingModal from '../components/BookingModal';
import PaymentGateway from '../components/PaymentGateway';
import ChatWindow from '../components/ChatWindow';
import { incrementPropertyView, createBookingRequest, submitPropertyReport, uploadReportEvidence } from '../userService';
import { notifyAdminPropertyReport } from '../emailService';
import { getOrCreateChatSession, SYSTEM_ADMIN_ID } from '../chatService';
import { supabase } from '../supabase';
import { 
  Bed, Home, Camera, Sparkles, CheckCircle2, ChevronDown, Layers, Flag, 
  ShieldAlert, AlertTriangle, X, Check, Upload, Image as ImageIcon, Send, 
  Phone, User as UserIcon, MessageSquare, Clock, Wifi, CookingPot, Car, 
  Bike, Bath, ShieldCheck, KeyRound, Shirt, Sun, Building2, Armchair, 
  Wind, Tv, Droplets, Utensils, Refrigerator, Lock, MapPin, Navigation, 
  GraduationCap, RotateCcw
} from 'lucide-react';
import { createKostSlug } from '../utils/slugUtils';

interface KostDetailProps {
  kost: Kost;
  onBack: () => void;
  onStartChat?: (id: string) => void;
  user?: any;
  onLoginRedirect?: () => void;
  validateProfile?: () => boolean;
  hideBookingAndChat?: boolean;
}

const InfoSection: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean; className?: string }> = ({ title, children, defaultOpen = true, className = "" }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`bg-white lg:bg-transparent rounded-3xl lg:rounded-none overflow-hidden ${className}`}>
      <div
        onClick={() => { if (window.innerWidth < 1024) setIsOpen(!isOpen); }}
        className="w-full flex items-center justify-between py-5 lg:py-0 lg:mb-6 cursor-pointer lg:cursor-default group px-6 lg:px-0 border-b lg:border-0 border-gray-50"
      >
        <h3 className="text-lg lg:text-xl font-black text-gray-900 uppercase tracking-tight group-hover:text-orange-500 lg:group-hover:text-gray-900 transition-colors">
          {title}
        </h3>
        <div className={`lg:hidden p-2 rounded-full transition-all duration-300 ${isOpen ? 'bg-orange-500 text-white rotate-180' : 'bg-gray-50 text-gray-400'}`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      <div className={`transition-all duration-500 ease-in-out overflow-hidden lg:max-h-none lg:opacity-100 lg:block ${isOpen ? 'max-h-[2000px] opacity-100 pb-8 px-6 lg:px-0' : 'max-h-0 opacity-0'}`}>
        {children}
      </div>
    </div>
  );
};



const KostDetail: React.FC<KostDetailProps> = ({ kost, onBack, onStartChat, user, onLoginRedirect, validateProfile, hideBookingAndChat = false }) => {
  const [currentPhoto, setCurrentPhoto] = useState(0);
  const [selectedParentTypeIdx, setSelectedParentTypeIdx] = useState(0);
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);

  // === SEO: Dynamic Meta Tags ===
  const kostName = kost.name || 'Kost Makassar';
  const kostArea = kost.area || kost.address || 'Makassar';
  const kostPrice = kost.price ? FORMAT_CURRENCY(kost.price) : '';
  const kostGender = (kost as any).gender === 'putra' ? 'Putra' : (kost as any).gender === 'putri' ? 'Putri' : (kost as any).gender === 'campur' ? 'Campur' : '';
  const genderLabel = kostGender ? ` Kost ${kostGender}` : ' Kost';
  const campusNearby = kost.campuses?.[0]?.name || '';
  const campusLabel = campusNearby ? ` Dekat ${campusNearby}` : '';

  const seoTitle = `${kostName}${campusLabel} - ${kostArea} | RuangSinggah.id`;
  const seoDescription = [
    `${genderLabel.trim()} di ${kostArea}`,
    kostPrice ? `Harga mulai ${kostPrice}/bulan` : '',
    kost.facilities?.slice(0, 3).join(', ') || '',
    campusNearby ? `Dekat ${campusNearby}.` : '',
    'Cek detail, foto, dan booking langsung di RuangSinggah.id.'
  ].filter(Boolean).join('. ');

  // First valid image URL for OG image
  const firstImage = (() => {
    const img = kost.imageUrls?.[0];
    if (!img) return 'https://ruangsinggah.id/logo.png';
    if (typeof img === 'string') return img;
    return (img as any).url || (img as any).thumbnail || 'https://ruangsinggah.id/logo.png';
  })();

  const canonicalUrl = `https://ruangsinggah.id/kost/${createKostSlug(kost)}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Accommodation',
    name: kostName,
    description: seoDescription,
    url: canonicalUrl,
    image: firstImage,
    address: {
      '@type': 'PostalAddress',
      streetAddress: kost.address || '',
      addressLocality: kostArea,
      addressRegion: 'Sulawesi Selatan',
      addressCountry: 'ID'
    },
    ...(kost.price ? { priceRange: `Rp ${kost.price.toLocaleString('id-ID')}/bulan` } : {}),
    amenityFeature: (kost.facilities || []).map((f: string) => ({
      '@type': 'LocationFeatureSpecification',
      name: f,
      value: true
    })),
    ...(kost.lat && kost.lng ? {
      geo: {
        '@type': 'GeoCoordinates',
        latitude: kost.lat,
        longitude: kost.lng
      }
    } : {})
  };
  // === END SEO ===

  // Auto-track view (only when not in isolated preview mode)
  useEffect(() => {
    if (kost.id && !hideBookingAndChat) {
      incrementPropertyView(kost.id);
    }
  }, [kost.id, hideBookingAndChat]);

  const [selectedPeriod, setSelectedPeriod] = useState<PricingPeriod>('bulanan');
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isPaymentGatewayOpen, setIsPaymentGatewayOpen] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [tempBookingData, setTempBookingData] = useState<any>(null);
  const [showChatWindow, setShowChatWindow] = useState(false);
  const [activeChatSession, setActiveChatSession] = useState<any>(null);
  const [isSubmittingChat, setIsSubmittingChat] = useState(false);

  // --- LAPOR IKLAN KOST STATES ---
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportCategory, setReportCategory] = useState<string>('fraud');
  const [reportDescription, setReportDescription] = useState('');
  const [reporterName, setReporterName] = useState(user?.displayName || user?.name || '');
  const [reporterPhone, setReporterPhone] = useState(user?.phoneNumber || user?.phone || '');
  const [reportEvidenceFile, setReportEvidenceFile] = useState<File | null>(null);
  const [reportEvidencePreview, setReportEvidencePreview] = useState<string>('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      if (!reporterName) setReporterName(user.displayName || user.name || '');
      if (!reporterPhone) setReporterPhone(user.phoneNumber || user.phone || '');
    }
  }, [user]);

  const compressImageToWebP = async (file: File, quality = 0.82, maxDimension = 1920): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
                    type: "image/webp",
                    lastModified: Date.now()
                  });
                  resolve(newFile);
                } else {
                  resolve(file);
                }
              },
              'image/webp',
              quality
            );
          } else {
            resolve(file);
          }
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleEvidenceChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImageToWebP(file, 0.82, 1920);
      setReportEvidenceFile(compressed);
      setReportEvidencePreview(URL.createObjectURL(compressed));
    } catch (err) {
      console.error("Compression failed, using original:", err);
      setReportEvidenceFile(file);
      setReportEvidencePreview(URL.createObjectURL(file));
    }
  };

  const handleOpenReportModal = () => {
    setReportSuccess(false);
    setReportCategory('fraud');
    setReportDescription('');
    setReportEvidenceFile(null);
    setReportEvidencePreview('');
    setIsReportModalOpen(true);
  };

  const categoryOptions = [
    { id: 'fraud', label: 'Indikasi Penipuan / Minta Transfer di Luar Sistem', icon: '🚨' },
    { id: 'mismatch', label: 'Harga atau Fasilitas Tidak Sesuai Realita', icon: '🏷️' },
    { id: 'fake_location', label: 'Lokasi Titik Peta Palsu / Tidak Akurat', icon: '📍' },
    { id: 'closed_or_full', label: 'Kost Sudah Penuh / Tidak Beroperasi', icon: '🚫' },
    { id: 'inappropriate', label: 'Foto / Konten Tidak Pantas', icon: '🔞' },
    { id: 'other', label: 'Lainnya / Masalah Lain', icon: '📝' }
  ];

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportDescription.trim()) {
      alert("Harap tuliskan penjelasan kendala atau rincian masalah yang ditemukan.");
      return;
    }
    if (!reporterPhone.trim()) {
      alert("Harap masukkan nomor WhatsApp aktif Anda untuk konfirmasi.");
      return;
    }

    setIsSubmittingReport(true);
    try {
      let evidenceUrl = '';
      if (reportEvidenceFile) {
        evidenceUrl = await uploadReportEvidence(reportEvidenceFile, kost.id);
      }

      const selectedCatObj = categoryOptions.find(c => c.id === reportCategory);
      const catLabel = selectedCatObj ? `${selectedCatObj.icon} ${selectedCatObj.label}` : reportCategory;

      await submitPropertyReport({
        propertyId: kost.id,
        propertyName: kost.title || (kost as any).namaKost || 'Kost',
        reporterId: user?.id || user?.uid,
        reporterName: reporterName.trim() || 'Pengguna',
        reporterPhone: reporterPhone.trim(),
        category: reportCategory,
        categoryLabel: catLabel,
        description: reportDescription.trim(),
        evidenceUrls: evidenceUrl ? [evidenceUrl] : []
      });

      // Send async non-blocking notification to Admin email
      notifyAdminPropertyReport({
        propertyName: kost.title || (kost as any).namaKost || 'Kost',
        propertyId: kost.id,
        categoryLabel: catLabel,
        description: reportDescription.trim(),
        reporterName: reporterName.trim() || 'Pengguna',
        reporterPhone: reporterPhone.trim(),
        ownerName: (kost as any).ownerName || (kost as any).users?.name || '-',
        evidenceUrl: evidenceUrl || '-'
      }).catch(err => console.warn("Email alert failed (non-critical):", err));

      setReportSuccess(true);
    } catch (err: any) {
      alert("Gagal mengirim laporan: " + (err.message || err));
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const defaultRoom: RoomType = {
    name: 'Standard Room',
    size: '3x3',
    price: kost.price,
    pricing: [{ period: 'bulanan', price: kost.price }],
    features: [],
    roomFacilities: ['Kasur', 'Lemari'],
    bathroomFacilities: [],
    isAvailable: true
  };

  const selectedRoom = (kost.roomTypes && kost.roomTypes.length > 0)
    ? kost.roomTypes[selectedVariantIdx]
    : defaultRoom;

  // Auto-select the first available pricing period when room type changes
  useEffect(() => {
    if (selectedRoom.pricing && selectedRoom.pricing.length > 0) {
      // Prefer monthly if available, otherwise first available
      const hasMonthly = selectedRoom.pricing.find(p => p.period === 'bulanan');
      if (hasMonthly) {
        setSelectedPeriod('bulanan');
      } else {
        setSelectedPeriod(selectedRoom.pricing[0].period);
      }
    } else {
      // Fallback for legacy data
      setSelectedPeriod('bulanan');
    }
  }, [selectedVariantIdx, selectedRoom]);

  // --- EMPTY ROOMS PHOTO ISOLATION & GALLERY STATE ---
  const [activePhotoFilter, setActivePhotoFilter] = useState<'all' | string>('all');

  interface PhotoItem {
    url: string;
    label: string;
    category?: string;
    caption?: string;
    isRoom: boolean;
    roomName?: string;
  }

  // Helper to sanitize survey category labels from administrative tags like *Wajib, (Opsional), etc.
  const cleanPhotoCategoryLabel = (label: string): string => {
    if (!label) return '';
    return label
      .replace(/\*wajib/gi, '')
      .replace(/\*opsional/gi, '')
      .replace(/\(wajib\)/gi, '')
      .replace(/\(opsional\)/gi, '')
      .replace(/\*/g, '')
      .trim();
  };

  // Helper map from photosMeta if available from database
  const photosMetaMap = useMemo(() => {
    const map = new Map<string, { label?: string; category?: string; caption?: string }>();
    if (Array.isArray(kost.photosMeta)) {
      kost.photosMeta.forEach(pm => {
        const u = pm.url || pm.original;
        if (u) {
          map.set(u, {
            label: pm.label || pm.category,
            category: pm.category || pm.label,
            caption: pm.caption
          });
        }
      });
    }
    return map;
  }, [kost.photosMeta]);

  // Extract all property-level photos with their surveyed category labels and captions (Only if present in database)
  const propertyPhotos: PhotoItem[] = (kost.imageUrls || []).map((img: any, idx: number) => {
    const url = typeof img === 'string' ? img : (img?.url || img?.original || img?.thumbnail || '');
    let label = '';
    let category = '';
    let caption = '';

    const meta = photosMetaMap.get(url);
    if (meta) {
      label = meta.label || '';
      category = meta.category || '';
      caption = meta.caption || '';
    }

    if (!label && typeof img === 'object') {
      label = img.label || img.category || img.title || '';
      category = img.category || img.label || '';
      caption = img.caption || '';
    }

    if (!label) {
      if (Array.isArray(kost.photoCategories) && kost.photoCategories[idx]) {
        label = kost.photoCategories[idx];
      } else if (Array.isArray((kost as any).photo_categories) && (kost as any).photo_categories[idx]) {
        label = (kost as any).photo_categories[idx];
      } else if (kost.categorizedPhotos && typeof kost.categorizedPhotos === 'object') {
        for (const [catName, catUrls] of Object.entries(kost.categorizedPhotos)) {
          if (Array.isArray(catUrls) && catUrls.includes(url)) {
            label = catName;
            break;
          }
        }
      } else if ((kost as any).categorized_photos && typeof (kost as any).categorized_photos === 'object') {
        for (const [catName, catUrls] of Object.entries((kost as any).categorized_photos)) {
          if (Array.isArray(catUrls) && (catUrls as any[]).includes(url)) {
            label = catName;
            break;
          }
        }
      }
    }

    const cleanLabel = cleanPhotoCategoryLabel(label || category);
    const cleanCategory = cleanPhotoCategoryLabel(category || label);
    const finalCaption = caption && caption.trim() ? caption.trim() : cleanLabel;

    return { 
      url, 
      label: cleanLabel, 
      category: cleanCategory, 
      caption: finalCaption, 
      isRoom: false 
    };
  }).filter(p => !!p.url);

  // Normalize all individual room units and extract their photos with survey category labels
  const normalizedRooms = (kost.roomTypes || []).flatMap((rt: any, rtIdx: number) => {
    if (Array.isArray(rt.rooms) && rt.rooms.length > 0) {
      return rt.rooms.map((r: any, rSubIdx: number) => {
        const isAvail = r.status?.toLowerCase() === 'kosong' || r.status?.toLowerCase() === 'available' || r.isAvailable !== false;
        const rName = r.name || r.roomNumber ? (String(r.name || r.roomNumber).trim().toLowerCase().startsWith('kamar') ? (r.name || r.roomNumber) : `Kamar ${r.name || r.roomNumber}`) : `Kamar ${rSubIdx + 1}`;

        const rawImages = r.images || r.image_urls || [];
        const roomPhotoItems: PhotoItem[] = rawImages.map((img: any, imgIdx: number) => {
          const url = typeof img === 'string' ? img : (img?.url || img?.original || '');
          let label = '';
          if (typeof img === 'object' && (img.label || img.category || img.caption || img.title)) {
            label = img.label || img.category || img.caption || img.title;
          } else if (Array.isArray(r.photoCategories) && r.photoCategories[imgIdx]) {
            label = r.photoCategories[imgIdx];
          } else if (Array.isArray(r.photo_categories) && r.photo_categories[imgIdx]) {
            label = r.photo_categories[imgIdx];
          } else if (Array.isArray(rt.photoCategories) && rt.photoCategories[imgIdx]) {
            label = rt.photoCategories[imgIdx];
          } else if (Array.isArray(rt.photo_categories) && rt.photo_categories[imgIdx]) {
            label = rt.photo_categories[imgIdx];
          } else if (r.categorizedPhotos && typeof r.categorizedPhotos === 'object') {
            for (const [catName, catUrls] of Object.entries(r.categorizedPhotos)) {
              if (Array.isArray(catUrls) && catUrls.includes(url)) {
                label = catName;
                break;
              }
            }
          }

          if (!label) {
            const defaultRoomCats = ['Interior Kamar', 'Kamar Mandi', 'Tempat Tidur', 'Lemari / Storage'];
            label = defaultRoomCats[imgIdx] || `Foto Kamar ${imgIdx + 1}`;
          }

          return { url, label: cleanPhotoCategoryLabel(label), isRoom: true, roomName: rName };
        }).filter(p => !!p.url);

        return {
          id: r.id || `room_${rtIdx}_${rSubIdx}`,
          name: rName,
          rawName: r.name || r.roomNumber,
          variantIdx: rtIdx,
          isAvailable: isAvail,
          status: r.status || (isAvail ? 'Kosong' : 'Terisi'),
          price: Number(r.price) || Number(rt.price) || Number(kost.price) || 0,
          size: r.size || rt.size || '3x3',
          images: roomPhotoItems.map(p => p.url),
          photoItems: roomPhotoItems
        };
      });
    }

    const isAvail = rt.isAvailable !== false && rt.status?.toLowerCase() !== 'terisi' && rt.status?.toLowerCase() !== 'penuh';
    const rName = rt.name ? (String(rt.name).trim().toLowerCase().startsWith('kamar') ? rt.name : `Kamar ${rt.name}`) : `Kamar ${rtIdx + 1}`;
    const rawImages = rt.images || rt.image_urls || [];

    // --- FALLBACK: Untuk kost biasa (non-managed), jika rt.images kosong,
    // coba ekstrak foto dari propertyPhotos yang labelnya mengandung nama tipe kamar ini.
    // Contoh: foto berlabel "Interior Kamar: Standard" atau "Kamar Mandi: VIP" akan dicocokkan
    // ke roomType dengan name "Standard" atau "VIP".
    const buildRoomPhotoItemsFromRaw = (): PhotoItem[] => {
      return rawImages.map((img: any, imgIdx: number) => {
        const url = typeof img === 'string' ? img : (img?.url || img?.original || '');
        let label = '';
        if (typeof img === 'object' && (img.label || img.category || img.caption || img.title)) {
          label = img.label || img.category || img.caption || img.title;
        } else if (Array.isArray(rt.photoCategories) && rt.photoCategories[imgIdx]) {
          label = rt.photoCategories[imgIdx];
        } else if (Array.isArray(rt.photo_categories) && rt.photo_categories[imgIdx]) {
          label = rt.photo_categories[imgIdx];
        } else if (rt.categorizedPhotos && typeof rt.categorizedPhotos === 'object') {
          for (const [catName, catUrls] of Object.entries(rt.categorizedPhotos)) {
            if (Array.isArray(catUrls) && catUrls.includes(url)) {
              label = catName;
              break;
            }
          }
        }
        if (!label) {
          const defaultRoomCats = ['Interior Kamar', 'Kamar Mandi', 'Tempat Tidur', 'Lemari / Storage'];
          label = defaultRoomCats[imgIdx] || `Foto Kamar ${imgIdx + 1}`;
        }
        return { url, label: cleanPhotoCategoryLabel(label), isRoom: true, roomName: rName };
      }).filter((p: PhotoItem) => !!p.url);
    };

    let roomPhotoItems: PhotoItem[] = buildRoomPhotoItemsFromRaw();

    // Fallback: jika foto unit kosong dan ini adalah kost biasa (non-managed),
    // gunakan propertyPhotos yang labelnya relevan dengan nama tipe kamar ini.
    if (roomPhotoItems.length === 0 && !kost.isManaged && rt.name) {
      const rtNameLower = String(rt.name).trim().toLowerCase();
      // Coba cocokkan: "Interior Kamar: Standard" mengandung "standard" → match dengan rt.name "Standard"
      const matchedFromPropertyPhotos = propertyPhotos.filter(pp => {
        const lbl = (pp.label || pp.category || '').toLowerCase();
        return lbl.includes(rtNameLower);
      });

      if (matchedFromPropertyPhotos.length > 0) {
        // Tandai sebagai foto kamar (isRoom: true) dengan roomName tipe ini
        roomPhotoItems = matchedFromPropertyPhotos.map(pp => ({
          ...pp,
          isRoom: true,
          roomName: rName
        }));
      }
    }

    return [{
      id: rt.id || `room_${rtIdx}`,
      name: rName,
      rawName: rt.name,
      variantIdx: rtIdx,
      isAvailable: isAvail,
      status: rt.status || (isAvail ? 'Kosong' : 'Terisi'),
      price: Number(rt.price) || Number(kost.price) || 0,
      size: rt.size || '3x3',
      images: roomPhotoItems.map(p => p.url),
      photoItems: roomPhotoItems
    }];
  });

  // Interface for Parent-Child room grouping
  interface ChildRoomUnit {
    id: string;
    variantIdx: number;
    roomNumber: string;
    displayName: string;
    floor: string;
    status: string;
    isAvailable: boolean;
    price: number;
    size: string;
    pricing: any[];
    roomFacilities: string[];
    bathroomFacilities: string[];
    kitchenFacilities: string[];
    images: string[];
    photoItems: PhotoItem[];
    rawRoom: any;
  }

  interface ParentRoomGroup {
    typeName: string;
    minPrice: number;
    size: string;
    roomFacilities: string[];
    availableCount: number;
    totalCount: number;
    isAvailable: boolean;
    rooms: ChildRoomUnit[];
  }

  // Compute Parent-Child room groups
  const parentRoomGroups: ParentRoomGroup[] = useMemo(() => {
    if (!kost.roomTypes || kost.roomTypes.length === 0) {
      return [{
        typeName: defaultRoom.name,
        minPrice: defaultRoom.price,
        size: defaultRoom.size,
        roomFacilities: defaultRoom.roomFacilities || [],
        availableCount: 1,
        totalCount: 1,
        isAvailable: true,
        rooms: [{
          id: 'default_room',
          variantIdx: 0,
          roomNumber: '1',
          displayName: 'Kamar 1',
          floor: 'Lantai 1',
          status: 'Kosong',
          isAvailable: true,
          price: defaultRoom.price,
          size: defaultRoom.size,
          pricing: defaultRoom.pricing || [],
          roomFacilities: defaultRoom.roomFacilities || [],
          bathroomFacilities: [],
          kitchenFacilities: [],
          images: [],
          photoItems: [],
          rawRoom: defaultRoom
        }]
      }];
    }

    if (!kost.isManaged) {
      // For regular kost: each item in kost.roomTypes is its own parent type
      return kost.roomTypes.map((rt: any, idx: number) => {
        const isAvail = rt.isAvailable !== false && rt.status?.toLowerCase() !== 'terisi' && rt.status?.toLowerCase() !== 'penuh';
        const rName = rt.name || `Tipe ${idx + 1}`;
        const matchedNorm = normalizedRooms.find(r => r.variantIdx === idx);

        return {
          typeName: rName,
          minPrice: Number(rt.pricing?.find((p: any) => p.period === 'bulanan')?.price || rt.pricing?.[0]?.price || rt.price || kost.price || 0),
          size: rt.size || '3x3',
          roomFacilities: rt.roomFacilities || [],
          availableCount: isAvail ? 1 : 0,
          totalCount: 1,
          isAvailable: isAvail,
          rooms: [{
            id: rt.id || `room_${idx}`,
            variantIdx: idx,
            roomNumber: rName,
            displayName: rName,
            floor: rt.floor || '',
            status: isAvail ? 'Kosong' : 'Terisi',
            isAvailable: isAvail,
            price: Number(rt.price || kost.price || 0),
            size: rt.size || '3x3',
            pricing: rt.pricing || [{ period: 'bulanan', price: rt.price || kost.price }],
            roomFacilities: rt.roomFacilities || [],
            bathroomFacilities: rt.bathroomFacilities || [],
            kitchenFacilities: rt.kitchenFacilities || [],
            images: matchedNorm?.images || [],
            photoItems: matchedNorm?.photoItems || [],
            rawRoom: rt
          }]
        };
      });
    }

    // For KostManager: Group rooms by type (e.g. 'Standard', 'VIP', etc.)
    const groupsMap = new Map<string, ChildRoomUnit[]>();

    kost.roomTypes.forEach((rt: any, idx: number) => {
      const typeKey = (rt.type && rt.type.trim()) ? rt.type.trim() : (rt.roomTypeName || 'Standard');
      const isAvail = rt.isAvailable !== false && rt.status?.toLowerCase() !== 'terisi' && rt.status?.toLowerCase() !== 'penuh';
      const rNum = String(rt.name || rt.roomNumber || idx + 1).trim();
      const displayName = rNum.toLowerCase().startsWith('kamar') ? rNum : `Kamar ${rNum}`;
      const matchedNorm = normalizedRooms.find(r => r.variantIdx === idx);

      const childUnit: ChildRoomUnit = {
        id: rt.id || `room_${idx}`,
        variantIdx: idx,
        roomNumber: rNum,
        displayName: displayName,
        floor: rt.floor || 'Lantai 1',
        status: isAvail ? 'Kosong' : 'Terisi',
        isAvailable: isAvail,
        price: Number(rt.price || kost.price || 0),
        size: rt.size || '3x3',
        pricing: rt.pricing || [{ period: 'bulanan', price: rt.price || kost.price }],
        roomFacilities: rt.roomFacilities || [],
        bathroomFacilities: rt.bathroomFacilities || [],
        kitchenFacilities: rt.kitchenFacilities || [],
        images: matchedNorm?.images || [],
        photoItems: matchedNorm?.photoItems || [],
        rawRoom: rt
      };

      if (!groupsMap.has(typeKey)) {
        groupsMap.set(typeKey, []);
      }
      groupsMap.get(typeKey)!.push(childUnit);
    });

    return Array.from(groupsMap.entries()).map(([typeName, rooms]) => {
      const sortedRooms = [...rooms].sort((a, b) => {
        return a.displayName.localeCompare(b.displayName, undefined, { numeric: true, sensitivity: 'base' });
      });
      const availableRooms = sortedRooms.filter(r => r.isAvailable);
      const minPrice = Math.min(...sortedRooms.map(r => {
        const bulanan = r.pricing?.find(p => p.period === 'bulanan');
        return bulanan?.price || r.pricing?.[0]?.price || r.price || 0;
      }).filter(p => p > 0)) || Number(kost.price || 0);

      // Common facilities from rooms
      const facSet = new Set<string>();
      sortedRooms.forEach(r => (r.roomFacilities || []).forEach(f => facSet.add(f)));

      return {
        typeName: typeName.toLowerCase().startsWith('tipe') ? typeName : `Tipe ${typeName}`,
        minPrice,
        size: sortedRooms[0]?.size || '3x3',
        roomFacilities: Array.from(facSet),
        availableCount: availableRooms.length,
        totalCount: sortedRooms.length,
        isAvailable: availableRooms.length > 0,
        rooms: sortedRooms
      };
    });
  }, [kost.roomTypes, kost.isManaged, kost.price, normalizedRooms]);

  const currentParentGroup = parentRoomGroups[selectedParentTypeIdx] || parentRoomGroups[0];
  const selectedChildRoom = currentParentGroup?.rooms.find(r => r.variantIdx === selectedVariantIdx) || currentParentGroup?.rooms[0];

  // Filter rooms for photo navigation bar:
  // - KostManager: hanya tampilkan unit kamar yang masih kosong/tersedia
  // - Kost biasa (non-managed): tampilkan semua tipe kamar yang memiliki foto (tidak peduli status)
  const emptyRooms = kost.isManaged
    ? normalizedRooms.filter(r => r.isAvailable)
    : normalizedRooms.filter(r => r.photoItems && r.photoItems.length > 0);

  // Active room if a specific room filter is selected
  const activeFilteredRoom = activePhotoFilter !== 'all'
    ? normalizedRooms.find(r => r.id === activePhotoFilter || r.name === activePhotoFilter || r.rawName === activePhotoFilter)
    : null;

  // Only show room photo navigation bar if there are rooms with distinct photos
  const hasDistinctRoomPhotos = emptyRooms.some(r => r.photoItems && r.photoItems.length > 0 && r.images && r.images.length > 0);
  const showRoomPhotoNav = emptyRooms.length > 0 && hasDistinctRoomPhotos;

  // Compute displayed photo items with surveyed labels based on active filter
  const displayedPhotoItems: PhotoItem[] = (() => {
    if (activeFilteredRoom) {
      if (activeFilteredRoom.photoItems && activeFilteredRoom.photoItems.length > 0) {
        return activeFilteredRoom.photoItems;
      }
      // If room has no specific photos, fallback to property photos
      return propertyPhotos.length > 0 ? propertyPhotos : [{ url: 'https://ruangsinggah.id/logo.png', label: '', isRoom: false }];
    }

    // Default 'all': Property photos + all empty rooms photos combined
    const allVacantPhotos = emptyRooms.flatMap(r => r.photoItems || []);
    const combined = [...propertyPhotos, ...allVacantPhotos];

    // De-duplicate by URL
    const seen = new Set<string>();
    const unique: PhotoItem[] = [];
    combined.forEach(p => {
      if (p.url && !seen.has(p.url)) {
        seen.add(p.url);
        unique.push(p);
      }
    });

    return unique.length > 0 ? unique : (propertyPhotos.length > 0 ? propertyPhotos : [{ url: 'https://ruangsinggah.id/logo.png', label: '', isRoom: false }]);
  })();

  const displayedImages: string[] = displayedPhotoItems.map(p => p.url);
  const currentPhotoItem = displayedPhotoItems[currentPhoto] || displayedPhotoItems[0];

  const nextPhoto = () => setCurrentPhoto((prev) => (prev + 1) % (displayedImages.length || 1));
  const prevPhoto = () => setCurrentPhoto((prev) => (prev - 1 + (displayedImages.length || 1)) % (displayedImages.length || 1));

  const handleBookingClick = () => {
    if (kost.isManaged) {
      if (!selectedChildRoom || !selectedChildRoom.isAvailable) {
        alert("Silakan pilih nomor kamar yang masih tersedia terlebih dahulu.");
        return;
      }
    } else {
      if (!selectedRoom.isAvailable) {
        alert("Mohon maaf, tipe kamar ini sedang penuh.");
        return;
      }
    }

    if (!user) {
      if (confirm("Anda harus login untuk melakukan booking. Login sekarang?")) {
        onLoginRedirect?.();
      }
      return;
    }

    if (validateProfile) {
      const isValid = validateProfile();
      if (!isValid) return;
    }

    setIsBookingModalOpen(true);
  };

  const handleConfirmBooking = async (data: any) => {
    try {
      setTempBookingData(data);
      setIsBookingModalOpen(false);

      if (!user) {
        alert('Anda harus login untuk melakukan pengajuan sewa.');
        return;
      }

      const isKm = Boolean(kost.isManaged || (kost as any).is_managed);

      await createBookingRequest({
        userId: user.id || user.uid,
        productId: kost.id,
        productType: 'kost_booking',
        amount: data.total,
        metadata: {
          kostId: kost.id,
          kostName: kost.title,
          is_managed_kost: isKm,
          isManaged: isKm,
          managed_by: isKm ? 'kostmanager' : 'mitra',
          imageUrls: kost.image_urls,
          periodLabel: periodLabels[selectedPeriod] || selectedPeriod,
          roomType: isKm 
            ? (currentParentGroup?.typeName || selectedRoom.type || selectedRoom.name || '-')
            : (data.variantName || selectedRoom.name || '-'),

          roomNumber: kost.isManaged 
            ? (selectedChildRoom?.roomNumber || selectedRoom.displayName || selectedRoom.name || null)
            : null,
          roomId: kost.isManaged 
            ? (selectedChildRoom?.id || selectedRoom.id || null)
            : null,
          startDate: data.startDate || new Date().toISOString().split('T')[0],
          endDate: (() => {
            const d = new Date(data.startDate || new Date());
            const p = data.period;
            if (p === 'harian') d.setDate(d.getDate() + 1);
            else if (p === 'mingguan') d.setDate(d.getDate() + 7);
            else if (p === 'bulanan') d.setMonth(d.getMonth() + 1);
            else if (p === '3bulanan') d.setMonth(d.getMonth() + 3);
            else if (p === '6bulanan') d.setMonth(d.getMonth() + 6);
            else if (p === 'tahunan') d.setFullYear(d.getFullYear() + 1);
            return d.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
          })(),
          ...data
        }
      });

      setBookingSuccess(true);
    } catch (err) {
      console.error('Failed to submit booking request:', err);
      alert('Gagal mengirim pengajuan sewa. Silakan coba lagi.');
    }
  };

  const handlePaymentSuccess = () => {
    setIsPaymentGatewayOpen(false);
    setBookingSuccess(true);
    console.log('Payment Success for Booking:', { ...tempBookingData, kostId: kost.id });
  };

  const getPriceForPeriod = (period: string) => {
    const scheme = selectedRoom.pricing?.find(p => p.period === period);
    return scheme ? scheme.price : (period === 'bulanan' ? selectedRoom.price : 0);
  };

  const activePrice = getPriceForPeriod(selectedPeriod);

  const handleOpenChat = async () => {
    if (!user) {
      if (confirm("Anda harus login untuk memulai chat dengan pemilik. Login sekarang?")) {
        onLoginRedirect?.();
      }
      return;
    }

    try {
      setIsSubmittingChat(true);
      // Jika properti dikelola KostManager, arahkan chat ke KostManager Admin (SYSTEM_ADMIN_ID)
      const isKostManagerManaged = (kost as any).is_managed || (kost as any).isKostManager;
      const targetOwnerId = isKostManagerManaged ? SYSTEM_ADMIN_ID : (kost.ownerUid || SYSTEM_ADMIN_ID);
      
      const session = await getOrCreateChatSession(
        user.uid, 
        targetOwnerId, 
        kost.id,
        user.displayName || user.name || user.email?.split('@')[0] || 'Calon Penghuni',
        user.photoURL || user.avatar_url || ''
      );
      setActiveChatSession(session);
      setShowChatWindow(true);
    } catch (error) {
      console.error('Failed to open chat:', error);
      alert('Gagal membuka chat. Silakan coba lagi nanti.');
    } finally {
      setIsSubmittingChat(false);
    }
  };

  // Check if location data is valid (non-zero coordinates)
  const hasValidLocation = kost.location && (kost.location.lat !== 0 || kost.location.lng !== 0);

  // Pisahkan dan hilangkan duplikasi fasilitas publik dan kampus terdekat
  const publicFacilitiesList = useMemo(() => {
    return kost.publicFacilities || [];
  }, [kost.publicFacilities]);

  const campusList = useMemo(() => {
    const raw = kost.campuses || [];
    if (publicFacilitiesList.length === 0) return raw;
    const publicNames = new Set(publicFacilitiesList.map(p => p.name.toLowerCase().trim()));
    return raw.filter(c => !publicNames.has(c.name.toLowerCase().trim()));
  }, [kost.campuses, publicFacilitiesList]);

  const hasCampuses = campusList.length > 0;
  const hasPublicFacilities = publicFacilitiesList.length > 0;
  const hasLocationSection = hasValidLocation || hasCampuses || hasPublicFacilities;

  // --- INTERACTIVE IN-APP ROUTE PREVIEW STATE ---
  interface ActiveRouteInfo {
    name: string;
    lat: number;
    lng: number;
    type: 'campus' | 'facility';
    distance?: string;
    walkDuration?: string;
    motoDuration?: string;
    carDuration?: string;
  }

  const [activeRoute, setActiveRoute] = useState<ActiveRouteInfo | null>(null);
  const mapPreviewRef = React.useRef<HTMLDivElement>(null);

  const handleSelectRoute = (dest: ActiveRouteInfo) => {
    // Jika rute yang sama diklik lagi, toggle off (kembali ke titik kost)
    if (activeRoute && activeRoute.name === dest.name && activeRoute.lat === dest.lat && activeRoute.lng === dest.lng) {
      setActiveRoute(null);
      return;
    }
    setActiveRoute(dest);
    // Smooth scroll ke layar mini map
    if (mapPreviewRef.current) {
      mapPreviewRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleResetRoute = () => {
    setActiveRoute(null);
  };

  const originLat = kost.location?.lat || 0;
  const originLng = kost.location?.lng || 0;

  // Dynamic Embed URL: Direction vs Single Pin
  const currentEmbedUrl = useMemo(() => {
    if (activeRoute && activeRoute.lat && activeRoute.lng && originLat && originLng) {
      return `https://maps.google.com/maps?saddr=${originLat},${originLng}&daddr=${activeRoute.lat},${activeRoute.lng}&output=embed`;
    }
    return `https://maps.google.com/maps?q=${originLat},${originLng}&z=16&output=embed`;
  }, [originLat, originLng, activeRoute]);

  // Dynamic External Navigation URL
  const externalMapsUrl = useMemo(() => {
    if (activeRoute && activeRoute.lat && activeRoute.lng && originLat && originLng) {
      return `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${activeRoute.lat},${activeRoute.lng}`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${originLat},${originLng}`;
  }, [originLat, originLng, activeRoute]);

  const periodLabels: Record<string, string> = {
    'harian': 'Per Hari',
    'mingguan': 'Per Minggu',
    'bulanan': 'Per Bulan',
    '3bulanan': 'Per 3 Bulan',
    '6bulanan': 'Per 6 Bulan',
    'tahunan': 'Per Tahun'
  };

  // --- STRUCTURED PUBLIC & ROOM FACILITIES PARSER ---
  interface StructuredFacilityGroup {
    id: string;
    title: string;
    icon: React.ReactNode;
    subItems: string[];
  }

  interface StandaloneFacilityItem {
    name: string;
    icon: React.ReactNode;
  }

  const structuredPublicFacilities = useMemo(() => {
    const rawFacilities = kost.facilities || [];
    const extraKitchen = (kost as any).publicKitchenFacilities || (kost as any).public_kitchen_facilities || [];
    const extraParking = (kost as any).publicParkingFacilities || (kost as any).public_parking_facilities || [];

    const allFacilities = Array.from(new Set([
      ...rawFacilities,
      ...extraKitchen,
      ...extraParking
    ])).filter(f => f && typeof f === 'string' && f.trim().length > 0);

    const matchedItems = new Set<string>();

    // 1. DAPUR BERSAMA
    const kitchenKeywords = ['dapur bersama', 'dapur umum', 'dapur'];
    const kitchenSubOptions = [
      'kompor', 'kulkas bersama', 'kulkas', 'dispenser air', 'dispenser',
      'wastafel cuci piring', 'wastafel', 'peralatan masak', 'meja makan bersama', 'meja makan',
      'kitchen set', 'tabung gas', 'peralatan makan', 'rice cooker', 'microwave'
    ];
    
    const hasKitchenParent = allFacilities.some(f => kitchenKeywords.includes(f.toLowerCase().trim()));
    const kitchenSubs: string[] = [];

    allFacilities.forEach(f => {
      const lower = f.toLowerCase().trim();
      if (kitchenKeywords.includes(lower)) {
        matchedItems.add(f);
      } else if (kitchenSubOptions.some(sub => lower === sub || lower.includes(sub))) {
        if (hasKitchenParent || lower.includes('kompor') || lower.includes('kulkas') || lower.includes('masak') || lower.includes('dispenser') || lower.includes('cuci piring')) {
          kitchenSubs.push(f);
          matchedItems.add(f);
        }
      }
    });

    // 2. AREA PARKIR
    const parkingKeywords = ['area parkir', 'parkir', 'parkiran', 'tempat parkir'];
    const parkingSubOptions = ['parkir motor', 'parkir mobil', 'parkir sepeda', 'garasi motor', 'garasi mobil', 'parkir gratis', 'parkir luas'];
    const hasParkingParent = allFacilities.some(f => parkingKeywords.includes(f.toLowerCase().trim()));
    const parkingSubs: string[] = [];

    allFacilities.forEach(f => {
      const lower = f.toLowerCase().trim();
      if (parkingKeywords.includes(lower)) {
        matchedItems.add(f);
      } else if (parkingSubOptions.some(sub => lower === sub || lower.includes(sub))) {
        parkingSubs.push(f);
        matchedItems.add(f);
      }
    });

    // 3. WC UMUM / LUAR
    const wcKeywords = ['wc umum', 'toilet umum', 'kamar mandi luar', 'wc luar'];
    const wcSubOptions = ['kloset duduk', 'kloset jongkok', 'shower', 'wastafel', 'bak mandi', 'ember & gayung'];
    const hasWcParent = allFacilities.some(f => wcKeywords.includes(f.toLowerCase().trim()));
    const wcSubs: string[] = [];

    allFacilities.forEach(f => {
      const lower = f.toLowerCase().trim();
      if (wcKeywords.includes(lower)) {
        matchedItems.add(f);
      } else if (hasWcParent && wcSubOptions.some(sub => lower === sub || lower.includes(sub))) {
        wcSubs.push(f);
        matchedItems.add(f);
      }
    });

    // 4. RUANG TAMU & BERSAMA
    const livingKeywords = ['ruang tamu', 'ruang tamu bersama', 'ruang santai', 'ruang bersama'];
    const livingSubOptions = ['sofa', 'tv bersama', 'meja tamu', 'kursi santai'];
    const hasLivingParent = allFacilities.some(f => livingKeywords.includes(f.toLowerCase().trim()));
    const livingSubs: string[] = [];

    allFacilities.forEach(f => {
      const lower = f.toLowerCase().trim();
      if (livingKeywords.includes(lower)) {
        matchedItems.add(f);
      } else if (hasLivingParent && livingSubOptions.some(sub => lower === sub || lower.includes(sub))) {
        livingSubs.push(f);
        matchedItems.add(f);
      }
    });

    const groups: StructuredFacilityGroup[] = [];

    if (hasKitchenParent || kitchenSubs.length > 0) {
      groups.push({
        id: 'dapur',
        title: 'Dapur Bersama',
        icon: <CookingPot className="w-5 h-5 text-orange-500" />,
        subItems: Array.from(new Set(kitchenSubs))
      });
    }

    if (hasParkingParent || parkingSubs.length > 0) {
      groups.push({
        id: 'parkir',
        title: 'Area Parkir',
        icon: <Car className="w-5 h-5 text-orange-500" />,
        subItems: Array.from(new Set(parkingSubs))
      });
    }

    if (hasWcParent || wcSubs.length > 0) {
      groups.push({
        id: 'wc',
        title: 'WC Umum / Luar',
        icon: <Bath className="w-5 h-5 text-orange-500" />,
        subItems: Array.from(new Set(wcSubs))
      });
    }

    if (hasLivingParent || livingSubs.length > 0) {
      groups.push({
        id: 'living',
        title: 'Ruang Tamu & Bersama',
        icon: <Armchair className="w-5 h-5 text-orange-500" />,
        subItems: Array.from(new Set(livingSubs))
      });
    }

    const getStandaloneIcon = (name: string): React.ReactNode => {
      const lower = name.toLowerCase().trim();
      if (lower.includes('wifi') || lower.includes('internet')) return <Wifi className="w-4 h-4 text-orange-500" />;
      if (lower.includes('cctv') || lower.includes('kamera')) return <Camera className="w-4 h-4 text-orange-500" />;
      if (lower.includes('security') || lower.includes('keamanan') || lower.includes('satpam')) return <ShieldCheck className="w-4 h-4 text-orange-500" />;
      if (lower.includes('24 jam') || lower.includes('akses') || lower.includes('bebas')) return <KeyRound className="w-4 h-4 text-orange-500" />;
      if (lower.includes('laundry') || lower.includes('cuci')) return <Shirt className="w-4 h-4 text-orange-500" />;
      if (lower.includes('jemuran') || lower.includes('jemur')) return <Sun className="w-4 h-4 text-orange-500" />;
      if (lower.includes('mushola') || lower.includes('musholla') || lower.includes('ibadah')) return <Sparkles className="w-4 h-4 text-orange-500" />;
      if (lower.includes('lift') || lower.includes('elevator')) return <Building2 className="w-4 h-4 text-orange-500" />;
      if (lower.includes('cleaning') || lower.includes('kebersihan')) return <Sparkles className="w-4 h-4 text-orange-500" />;
      if (lower.includes('ac')) return <Wind className="w-4 h-4 text-orange-500" />;
      if (lower.includes('water heater') || lower.includes('air panas')) return <Droplets className="w-4 h-4 text-orange-500" />;
      if (lower.includes('kolam') || lower.includes('renang')) return <Droplets className="w-4 h-4 text-orange-500" />;
      if (lower.includes('gym') || lower.includes('fitness')) return <Sparkles className="w-4 h-4 text-orange-500" />;
      if (lower.includes('rooftop')) return <Sun className="w-4 h-4 text-orange-500" />;
      if (lower.includes('balkon')) return <Home className="w-4 h-4 text-orange-500" />;
      return <CheckCircle2 className="w-4 h-4 text-orange-500" />;
    };

    const standalones: StandaloneFacilityItem[] = [];
    allFacilities.forEach(f => {
      if (!matchedItems.has(f)) {
        standalones.push({
          name: f,
          icon: getStandaloneIcon(f)
        });
      }
    });

    return { groups, standalones, totalCount: allFacilities.length };
  }, [kost.facilities, (kost as any).publicKitchenFacilities, (kost as any).publicParkingFacilities]);

  // Structured Room Facilities for currently selected room
  const structuredRoomFacilities = useMemo(() => {
    const rawRoomFacs = selectedRoom.roomFacilities || [];
    const rawBathFacs = selectedRoom.bathroomFacilities || [];
    const rawKitchenFacs = selectedRoom.kitchenFacilities || [];

    const isKosongan = rawRoomFacs.some(f => f.toLowerCase().includes('kosongan'));

    const bedroomItems = rawRoomFacs.filter(f => {
      const lower = f.toLowerCase().trim();
      return !lower.includes('kamar mandi') && !lower.includes('dapur dalam') && !lower.includes('kosongan');
    });

    const bathroomItems = Array.from(new Set([
      ...rawBathFacs,
      ...rawRoomFacs.filter(f => f.toLowerCase().includes('kamar mandi'))
    ]));

    const kitchenItems = Array.from(new Set([
      ...rawKitchenFacs,
      ...rawRoomFacs.filter(f => f.toLowerCase().includes('dapur dalam'))
    ]));

    const getRoomItemIcon = (name: string): React.ReactNode => {
      const lower = name.toLowerCase().trim();
      if (lower.includes('kasur') || lower.includes('bed')) return <Bed className="w-3.5 h-3.5 text-orange-500 shrink-0" />;
      if (lower.includes('lemari') || lower.includes('storage')) return <Layers className="w-3.5 h-3.5 text-orange-500 shrink-0" />;
      if (lower.includes('meja') || lower.includes('kursi')) return <Armchair className="w-3.5 h-3.5 text-orange-500 shrink-0" />;
      if (lower.includes('ac')) return <Wind className="w-3.5 h-3.5 text-orange-500 shrink-0" />;
      if (lower.includes('kipas')) return <Wind className="w-3.5 h-3.5 text-orange-500 shrink-0" />;
      if (lower.includes('tv') || lower.includes('televisi')) return <Tv className="w-3.5 h-3.5 text-orange-500 shrink-0" />;
      if (lower.includes('kulkas')) return <Refrigerator className="w-3.5 h-3.5 text-orange-500 shrink-0" />;
      if (lower.includes('water heater') || lower.includes('air panas')) return <Droplets className="w-3.5 h-3.5 text-orange-500 shrink-0" />;
      if (lower.includes('shower') || lower.includes('mandi') || lower.includes('wc') || lower.includes('kloset') || lower.includes('wastafel') || lower.includes('gayung') || lower.includes('bak')) return <Bath className="w-3.5 h-3.5 text-blue-500 shrink-0" />;
      if (lower.includes('kompor') || lower.includes('dapur') || lower.includes('kitchen') || lower.includes('dispenser') || lower.includes('cuci piring')) return <CookingPot className="w-3.5 h-3.5 text-amber-500 shrink-0" />;
      if (lower.includes('jendela') || lower.includes('ventilasi') || lower.includes('balkon')) return <Sun className="w-3.5 h-3.5 text-orange-500 shrink-0" />;
      return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />;
    };

    return {
      isKosongan,
      bedroomItems,
      bathroomItems,
      kitchenItems,
      getRoomItemIcon
    };
  }, [selectedRoom]);

  // Helper to calculate discount percentage
  const calculateDiscount = (scheme: { period: PricingPeriod; price: number }) => {
    // Determine base monthly price (prioritize explicit 'bulanan', else fallback)
    const monthlyScheme = selectedRoom.pricing?.find(p => p.period === 'bulanan');
    const baseMonthlyPrice = monthlyScheme ? monthlyScheme.price : selectedRoom.price;

    let durationInMonths = 0;
    if (scheme.period === '3bulanan') durationInMonths = 3;
    if (scheme.period === '6bulanan') durationInMonths = 6;
    if (scheme.period === 'tahunan') durationInMonths = 12;

    if (durationInMonths > 1) {
      const standardPrice = baseMonthlyPrice * durationInMonths;
      if (scheme.price < standardPrice) {
        const saving = standardPrice - scheme.price;
        const percent = Math.round((saving / standardPrice) * 100);
        return percent > 0 ? percent : 0;
      }
    }
    return 0;
  };

  if (bookingSuccess) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in-95 duration-500">
          <div className="relative">
            <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-green-50 relative z-10">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            </div>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-green-50 rounded-full animate-ping opacity-20"></div>
          </div>
          <div>
            <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight mb-4 text-center">Pengajuan Terkirim!</h2>
            <p className="text-gray-500 font-medium text-center">Pengajuan sewa Anda telah terkirim ke pemilik kost. Mohon tunggu konfirmasi ketersediaan kamar. Anda akan menerima notifikasi untuk langkah pembayaran selanjutnya.</p>
          </div>
          <div className="flex flex-col gap-4">
            <button
              onClick={() => window.location.href = Page.MY_BOOKINGS}
              className="bg-orange-500 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-orange-100 active:scale-95 transition-all"
            >
              Selesaikan & Lihat Status
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50/30 min-h-screen pb-24 lg:pb-20">
      {/* ===== SEO: Dynamic Meta Tags per Listing ===== */}
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <link rel="canonical" href={canonicalUrl} />
        <meta name="robots" content="index, follow" />

        {/* Open Graph */}
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:image" content={firstImage} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="id_ID" />
        <meta property="og:site_name" content="RuangSinggah.id" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDescription} />
        <meta name="twitter:image" content={firstImage} />

        {/* JSON-LD Accommodation Schema */}
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      </Helmet>
      {/* ===== END SEO ===== */}

      {/* Banner Mode Pratinjau Pemilik / Admin jika belum published */}
      {kost.status !== 'published' && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white px-4 py-3 shadow-md border-b border-amber-600">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 font-bold">
              <Clock size={16} className="shrink-0 animate-pulse" />
              <span>
                <strong>MODE PRATINJAU:</strong> Listing ini saat ini <strong>{kost.status === 'suspended' ? 'DITANGGUHKAN' : 'DALAM TAHAP PENINJAUAN ADMIN'}</strong> dan belum dapat dilihat oleh publik.
              </span>
            </div>
            <button 
              onClick={onBack}
              className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg font-black uppercase text-[10px] tracking-wider shrink-0 transition-colors cursor-pointer"
            >
              Kembali
            </button>
          </div>
        </div>
      )}

      {/* Mobile Sticky Header */}
      <div className="lg:hidden sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100 px-4 py-4 flex items-center justify-between">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <span className="font-bold text-gray-900 truncate max-w-[200px] uppercase tracking-tight text-xs">{kost.title}</span>
        {hideBookingAndChat ? (
          <div className="w-8" />
        ) : (
          <button
            onClick={handleOpenChat}
            disabled={isSubmittingChat}
            className="text-orange-500 font-black text-sm uppercase tracking-widest disabled:opacity-50"
          >
            {isSubmittingChat ? '...' : 'Tanya'}
          </button>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-12">
        {/* Breadcrumb Desktop */}
        <div className="hidden lg:flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-8">
          <button onClick={onBack} className="hover:text-orange-500 transition-colors">Semua Listing</button>
          <span>/</span>
          <span className="text-gray-900">{kost.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          <div className="lg:col-span-2 space-y-8 lg:space-y-12">
            {/* Gallery Section with Isolated Room Photos */}
            <div>
              <div className="relative group aspect-square lg:aspect-video rounded-3xl lg:rounded-[3rem] overflow-hidden shadow-2xl bg-gray-900 border border-gray-100 mb-4">
                <div className="absolute inset-0 flex transition-transform duration-700 ease-out" style={{ transform: `translateX(-${currentPhoto * 100}%)` }}>
                  {displayedImages.map((img, idx) => (
                    <img key={idx} src={img} className="w-full h-full object-cover shrink-0" alt={`Slide ${idx + 1}`} />
                  ))}
                </div>

                {/* Left/Right Navigation Controls */}
                {displayedImages.length > 1 && (
                  <div className="absolute inset-0 flex items-center justify-between p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={prevPhoto} className="p-3 bg-black/40 backdrop-blur-md text-white rounded-full hover:bg-white hover:text-orange-500 transition-all border border-white/20 cursor-pointer">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <button onClick={nextPhoto} className="p-3 bg-black/40 backdrop-blur-md text-white rounded-full hover:bg-white hover:text-orange-500 transition-all border border-white/20 cursor-pointer">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                    </button>
                  </div>
                )}

                {/* Active Photo Info & Counter Badge */}
                <div className="absolute bottom-6 right-6 max-w-[85%] bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/15 flex items-center gap-2">
                  <Camera size={12} className="text-orange-400 shrink-0" />
                  <span className="shrink-0">{currentPhoto + 1} / {displayedImages.length} FOTO</span>
                  {currentPhotoItem?.label ? (
                    <>
                      <span className="text-white/40 shrink-0">•</span>
                      <span className={`truncate ${currentPhotoItem.isRoom ? "text-orange-400 font-bold" : "text-emerald-400 font-bold"}`}>
                        {currentPhotoItem.isRoom
                          ? (currentPhotoItem.roomName ? `${currentPhotoItem.roomName} - ${currentPhotoItem.label}` : currentPhotoItem.label)
                          : currentPhotoItem.label}
                      </span>
                    </>
                  ) : null}
                </div>

                {/* Active Category Tag Top Left */}
                {currentPhotoItem && (currentPhotoItem.label || currentPhotoItem.category) && (
                  <div className="absolute top-6 left-6 max-w-[80%] bg-black/60 backdrop-blur-md text-white px-3.5 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider shadow-lg border border-white/20 flex items-center gap-1.5">
                    {currentPhotoItem.isRoom ? (
                      <>
                        <Bed size={13} className="text-orange-400 shrink-0" />
                        <span className="truncate">{currentPhotoItem.roomName ? `${currentPhotoItem.roomName} • ${currentPhotoItem.label || currentPhotoItem.category}` : (currentPhotoItem.label || currentPhotoItem.category)}</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={13} className="text-orange-400 shrink-0" />
                        <span className="truncate">{currentPhotoItem.label || currentPhotoItem.category}</span>
                      </>
                    )}
                  </div>
                )}

                {/* Photo Caption Overlay (Bottom Left) - Tampil jika caption ada dan berbeda dari kategori */}
                {currentPhotoItem?.caption && (
                  currentPhotoItem.caption.trim().toLowerCase() !== (currentPhotoItem.label || currentPhotoItem.category || '').trim().toLowerCase()
                ) && (
                  <div className="absolute bottom-6 left-6 max-w-[55%] hidden sm:flex items-center gap-1.5 bg-black/60 backdrop-blur-md text-white/95 px-3.5 py-2 rounded-2xl text-[11px] font-medium border border-white/15 shadow-md">
                    <MessageSquare size={13} className="text-orange-400 shrink-0" />
                    <span className="truncate" title={currentPhotoItem.caption}>{currentPhotoItem.caption}</span>
                  </div>
                )}
              </div>

              {/* Thumbnails Strip (Preview Foto Carousel - 1 Baris Horizontal Rapi) */}
              {displayedImages.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2 px-1 scrollbar-hide mb-4">
                  {displayedImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentPhoto(idx)}
                      className={`relative w-20 h-20 lg:w-24 lg:h-24 shrink-0 rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer ${currentPhoto === idx
                        ? 'ring-2 ring-orange-500 ring-offset-2 opacity-100 scale-95'
                        : 'opacity-50 hover:opacity-100 hover:scale-105'
                        }`}
                    >
                      <img src={img} className="w-full h-full object-cover" alt={`Thumbnail ${idx + 1}`} />
                    </button>
                  ))}
                </div>
              )}

              {/* Bilah Tombol Navigasi Foto Kamar — tampil jika ada foto spesifik per tipe/unit kamar */}
              {showRoomPhotoNav && (
                <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-2xs space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                    <span className="text-[11px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                      <Camera size={14} className="text-orange-500" />
                      {kost.isManaged ? 'Pilih Foto Unit Kamar' : 'Pilih Foto Tipe Kamar'}
                    </span>
                    {activePhotoFilter !== 'all' && (
                      <button
                        type="button"
                        onClick={() => {
                          setActivePhotoFilter('all');
                          setCurrentPhoto(0);
                        }}
                        className="text-[10px] font-black text-orange-600 hover:text-orange-700 uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1 bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-100"
                      >
                        Lihat Semua Foto ↺
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 pt-0.5">
                    {/* Tombol 1: Semua Foto */}
                    <button
                      type="button"
                      onClick={() => {
                        setActivePhotoFilter('all');
                        setCurrentPhoto(0);
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${activePhotoFilter === 'all'
                          ? 'bg-slate-900 text-white shadow-md ring-2 ring-slate-900 ring-offset-1'
                          : 'bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-100'
                        }`}
                    >
                      <Home size={13} />
                      <span>Semua Foto</span>
                    </button>

                    {/* Tombol per tipe/unit kamar yang memiliki foto */}
                    {emptyRooms.map((room) => {
                      const isSelected = activePhotoFilter === room.id || activePhotoFilter === room.name || activePhotoFilter === room.rawName;

                      return (
                        <button
                          key={room.id}
                          type="button"
                          onClick={() => {
                            setActivePhotoFilter(room.id);
                            setCurrentPhoto(0);
                            setSelectedVariantIdx(room.variantIdx);
                          }}
                          className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${isSelected
                              ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20 ring-2 ring-orange-500 ring-offset-1'
                              : 'bg-white text-slate-700 border border-slate-200 hover:border-orange-300 hover:bg-orange-50/30'
                            }`}
                        >
                          <Bed size={13} className={isSelected ? 'text-white' : 'text-orange-500'} />
                          <span>{room.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Social Media Review Section */}
            {(kost.instagramUrl || kost.tiktokUrl) && (
              <div className="flex flex-col sm:flex-row gap-4">
                {kost.instagramUrl && (
                  <a href={kost.instagramUrl} target="_blank" rel="noopener noreferrer" className="flex-1 bg-gradient-to-r from-pink-500 via-purple-500 to-orange-500 text-white p-4 rounded-2xl flex items-center justify-center gap-3 hover:opacity-90 transition-opacity shadow-lg shadow-pink-100">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M7.8 2H16.2C19.4 2 22 4.6 22 7.8V16.2C22 19.4 19.4 22 16.2 22H7.8C4.6 22 2 19.4 2 16.2V7.8C2 4.6 4.6 2 7.8 2M7.6 4C5.6 4 4 5.6 4 7.6V16.4C4 18.4 5.6 20 7.6 20H16.4C18.4 20 20 18.4 20 16.4V7.6C20 5.6 18.4 4 16.4 4H7.6M17.25 5.5C17.94 5.5 18.5 6.06 18.5 6.75C18.5 7.44 17.94 8 17.25 8C16.56 8 16 7.44 16 6.75C16 6.06 16.56 5.5 17.25 5.5M12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7M12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9Z" /></svg>
                    <span className="font-bold text-xs uppercase tracking-widest">Tonton Review di Instagram</span>
                  </a>
                )}
                {kost.tiktokUrl && (
                  <a href={kost.tiktokUrl} target="_blank" rel="noopener noreferrer" className="flex-1 bg-black text-white p-4 rounded-2xl flex items-center justify-center gap-3 hover:opacity-80 transition-opacity shadow-lg shadow-gray-200">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.89-.6-4.13-1.47-.12 3.35-.12 6.7 0 10.05-.1 1.63-.58 3.25-1.55 4.58-1.35 1.83-3.67 2.87-5.91 2.8-2.31-.01-4.6-.96-6.11-2.72-1.78-2.03-2.22-5.06-1.12-7.53.94-2.18 3.09-3.79 5.46-4.06.13 1.34.25 2.68.38 4.02-1.15.11-2.32.55-3.08 1.46-.73.91-.91 2.14-.52 3.24.4 1.15 1.43 2.03 2.62 2.23 1.28.2 2.64-.19 3.52-1.12.82-.9.99-2.19.98-3.37-.02-3.34-.02-6.67-.02-10.01V0c.01.01.01.01 0 .02z" /></svg>
                    <span className="font-bold text-xs uppercase tracking-widest">Tonton Review di TikTok</span>
                  </a>
                )}
              </div>
            )}

            {/* Video Tour Section */}
            {kost.videoUrls && kost.videoUrls.length > 0 && (
              <div className="bg-black rounded-[2rem] p-4 lg:p-6 border border-gray-900 shadow-sm overflow-hidden">
                <h3 className="text-white text-lg font-black uppercase tracking-tight mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> Video Tour
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {kost.videoUrls.map((url, idx) => (
                    <video
                      key={idx}
                      src={url}
                      controls
                      className="w-full aspect-video rounded-xl object-cover bg-gray-800"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Main Header Information */}
            <div className="bg-white rounded-[2rem] p-8 lg:p-10 border border-gray-100 shadow-sm">
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${kost.type === 'Putra' ? 'bg-blue-500 text-white' :
                  kost.type === 'Putri' ? 'bg-pink-500 text-white' :
                    'bg-purple-500 text-white'
                  }`}>{kost.type}</span>
                {kost.isManaged && (
                  <span className="bg-orange-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black flex items-center gap-2 border border-orange-400 shadow-lg shadow-orange-100 uppercase tracking-widest">
                    Terverifikasi
                  </span>
                )}
              </div>
              <h1 className="text-3xl lg:text-6xl font-black text-gray-900 mb-4 uppercase tracking-tighter leading-none">{kost.title}</h1>
              <div className="flex items-center text-gray-500 font-medium text-sm lg:text-lg">
                <svg className="w-5 h-5 mr-2 text-orange-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <span>{kost.address}, {kost.city}</span>
              </div>
            </div>

            {kost.description && (
              <InfoSection title="Deskripsi Lengkap">
                <p className="text-gray-600 leading-relaxed whitespace-pre-line text-sm lg:text-base">{kost.description}</p>
              </InfoSection>
            )}

            {(structuredPublicFacilities.groups.length > 0 || structuredPublicFacilities.standalones.length > 0) && (
              <InfoSection title="Fasilitas Umum">
                <div className="space-y-4">
                  {/* 1. Kartu Fasilitas Utama dengan Sub-Kelengkapan (Dapur Bersama, Area Parkir, WC Umum, Ruang Tamu) */}
                  {structuredPublicFacilities.groups.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {structuredPublicFacilities.groups.map(group => (
                        <div 
                          key={group.id} 
                          className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-gray-100/90 shadow-sm shadow-gray-100/50 flex flex-col justify-between gap-3 hover:border-orange-200 transition-all group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 border border-orange-100 group-hover:scale-105 group-hover:bg-orange-500 group-hover:text-white transition-all duration-300">
                              {group.icon}
                            </div>
                            <div>
                              <h4 className="font-black text-sm text-gray-900 tracking-tight">{group.title}</h4>
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                {group.subItems.length > 0 ? `${group.subItems.length} Kelengkapan Tersedia` : 'Fasilitas Bersama'}
                              </p>
                            </div>
                          </div>

                          {/* Chips Sub-Kelengkapan */}
                          {group.subItems.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1 border-t border-gray-50">
                              {group.subItems.map(sub => (
                                <span 
                                  key={sub} 
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-orange-50/70 text-orange-950 text-xs font-bold border border-orange-100/80 hover:bg-orange-100 transition-colors"
                                >
                                  <Check className="w-3 h-3 text-orange-500 shrink-0 stroke-[3]" />
                                  <span>{sub}</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 2. Grid Fasilitas Mandiri & Spesifikasi Bangunan */}
                  {structuredPublicFacilities.standalones.length > 0 && (
                    <div className="space-y-2 pt-1">
                      {structuredPublicFacilities.groups.length > 0 && (
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                          Fasilitas Gedung & Keamanan
                        </p>
                      )}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {structuredPublicFacilities.standalones.map(fac => (
                          <div 
                            key={fac.name} 
                            className="flex items-center gap-2.5 p-3 sm:p-3.5 rounded-2xl bg-white border border-gray-100 shadow-2xs hover:border-orange-200 transition-all group"
                          >
                            <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 border border-orange-100/60 group-hover:scale-105 group-hover:bg-orange-500 group-hover:text-white transition-all">
                              {fac.icon}
                            </div>
                            <span className="text-xs font-bold text-gray-800 truncate" title={fac.name}>
                              {fac.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </InfoSection>
            )}

            {kost.rules && kost.rules.length > 0 && (
              <InfoSection title="Peraturan Kost">
                <ul className="space-y-4">
                  {kost.rules.map((rule, index) => (
                    <li key={index} className="flex items-start text-gray-600 text-sm">
                      <svg className="w-5 h-5 text-red-500 mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                      {rule}
                    </li>
                  ))}
                </ul>
              </InfoSection>
            )}

            {hasLocationSection && (
              <InfoSection title="Lokasi & Lingkungan">
                <div className="space-y-6">
                  {hasValidLocation && (
                    <div ref={mapPreviewRef} className="space-y-3 scroll-mt-24">
                      {/* Active Route Header Banner (Muncul dinamis saat rute dipilih) */}
                      {activeRoute && (
                        <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white rounded-2xl p-3 px-4 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
                              <Navigation size={16} className="text-white" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] uppercase font-black tracking-wider text-orange-100">
                                  Menampilkan Rute Menuju
                                </span>
                                {activeRoute.distance && (
                                  <span className="bg-white/25 text-white px-2 py-0.5 rounded-full text-[10px] font-black">
                                    {activeRoute.distance}
                                  </span>
                                )}
                              </div>
                              <h5 className="font-black text-sm truncate max-w-[280px] sm:max-w-md text-white">
                                {activeRoute.name}
                              </h5>
                              <div className="flex items-center gap-2 text-[10px] text-orange-100 font-bold mt-0.5 flex-wrap">
                                {activeRoute.walkDuration && <span>🚶 {activeRoute.walkDuration}</span>}
                                {activeRoute.motoDuration && <span>• 🏍️ {activeRoute.motoDuration}</span>}
                                {activeRoute.carDuration && <span>• 🚗 {activeRoute.carDuration}</span>}
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={handleResetRoute}
                            className="self-end sm:self-center px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white text-white hover:text-orange-600 text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer shrink-0"
                            title="Kembalikan Peta ke Titik Kost"
                          >
                            <RotateCcw size={12} />
                            <span>Titik Kost</span>
                          </button>
                        </div>
                      )}

                      <div className="relative bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 group">
                        <iframe
                          key={currentEmbedUrl}
                          title={activeRoute ? `Rute ke ${activeRoute.name}` : "Kost Location"}
                          width="100%"
                          height="260"
                          style={{ border: 0 }}
                          loading="lazy"
                          allowFullScreen
                          src={currentEmbedUrl}
                          className="w-full h-64 sm:h-72 object-cover"
                        ></iframe>
                      </div>

                      {/* Action Button: Buka Google Maps / Navigasi Penuh */}
                      <a 
                        href={externalMapsUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className={`w-full ${
                          activeRoute ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-md' : 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 shadow-sm'
                        } py-3.5 px-4 rounded-2xl font-bold text-center transition-all text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]`}
                      >
                        {activeRoute ? (
                          <>
                            <Navigation size={16} />
                            <span>Buka Navigasi Penuh di Google Maps ↗</span>
                          </>
                        ) : (
                          <>
                            <MapPin size={16} className="text-orange-500" />
                            <span>Buka Google Maps</span>
                          </>
                        )}
                      </a>
                    </div>
                  )}

                  {hasCampuses && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between pl-1">
                        <div className="flex items-center gap-1.5">
                          <GraduationCap size={14} className="text-orange-600" />
                          <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider">Kampus Terdekat</h4>
                        </div>
                        <span className="text-[10px] font-bold text-gray-400">
                          {campusList.length} Lokasi
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                        {campusList.map((campus, idx) => {
                          const kmMatch = campus.distance?.match(/[\d.]+/);
                          const km = kmMatch ? parseFloat(kmMatch[0]) : 1;
                          const walkText = campus.walkDuration || `${Math.ceil((km / 4.2) * 60)}m`;
                          const motoText = campus.motoDuration || `${Math.ceil((km / 28) * 60) + 1}m`;
                          const carText = campus.carDuration || `${Math.ceil((km / 18) * 60) + 2}m`;

                          const isRouteActive = activeRoute?.name === campus.name && activeRoute?.lat === campus.lat && activeRoute?.lng === campus.lng;

                          return (
                            <div 
                              key={idx} 
                              className={`bg-white border rounded-xl p-2 px-2.5 flex items-center justify-between gap-2.5 transition-all group shadow-2xs ${
                                isRouteActive ? 'border-orange-500 bg-orange-50/40 ring-1 ring-orange-400' : 'border-gray-100 hover:border-orange-200 hover:bg-orange-50/20'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform ${
                                  isRouteActive ? 'bg-orange-500 text-white' : 'bg-orange-50 text-orange-600'
                                }`}>
                                  <GraduationCap size={14} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="font-bold text-gray-900 text-xs truncate leading-tight" title={campus.name}>
                                    {campus.name}
                                  </div>
                                  <div className="flex items-center gap-1.5 text-[10px] font-medium text-gray-500 mt-0.5 whitespace-nowrap">
                                    <span title="Jalan Kaki">🚶 {walkText}</span>
                                    <span className="text-gray-300">•</span>
                                    <span title="Sepeda Motor">🏍️ {motoText}</span>
                                    <span className="text-gray-300">•</span>
                                    <span title="Mobil">🚗 {carText}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="font-bold text-orange-600 bg-orange-50 border border-orange-100/80 px-2 py-0.5 rounded-lg text-[10px] whitespace-nowrap">
                                  {campus.distance}
                                </span>

                                {campus.lat && campus.lng ? (
                                  <button
                                    type="button"
                                    onClick={() => handleSelectRoute({
                                      name: campus.name,
                                      lat: campus.lat,
                                      lng: campus.lng,
                                      type: 'campus',
                                      distance: campus.distance,
                                      walkDuration: walkText,
                                      motoDuration: motoText,
                                      carDuration: carText
                                    })}
                                    className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all active:scale-95 shadow-2xs cursor-pointer ${
                                      isRouteActive 
                                        ? 'bg-orange-500 text-white border border-orange-500 shadow-sm' 
                                        : 'text-orange-600 hover:text-white bg-orange-50 hover:bg-orange-500 border border-orange-100/60 hover:border-orange-500'
                                    }`}
                                    title={isRouteActive ? 'Klik untuk sembunyikan rute' : 'Tampilkan rute pada peta mini di atas'}
                                  >
                                    <Navigation size={10} className={`shrink-0 ${isRouteActive ? 'rotate-45' : ''}`} />
                                    <span>{isRouteActive ? 'Aktif ✓' : 'Rute'}</span>
                                  </button>
                                ) : null}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {hasPublicFacilities && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between pl-1">
                        <div className="flex items-center gap-1.5">
                          <Building2 size={14} className="text-blue-600" />
                          <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider">Fasilitas Publik</h4>
                        </div>
                        <span className="text-[10px] font-bold text-gray-400">
                          {publicFacilitiesList.length} Lokasi
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                        {publicFacilitiesList.map((fac, idx) => {
                          const kmMatch = fac.distance?.match(/[\d.]+/);
                          const km = kmMatch ? parseFloat(kmMatch[0]) : 1;
                          const walkText = fac.walkDuration || `${Math.ceil((km / 4.2) * 60)}m`;
                          const motoText = fac.motoDuration || `${Math.ceil((km / 28) * 60) + 1}m`;
                          const carText = fac.carDuration || `${Math.ceil((km / 18) * 60) + 2}m`;

                          const isRouteActive = activeRoute?.name === fac.name && activeRoute?.lat === fac.lat && activeRoute?.lng === fac.lng;

                          return (
                            <div 
                              key={idx} 
                              className={`bg-white border rounded-xl p-2 px-2.5 flex items-center justify-between gap-2.5 transition-all group shadow-2xs ${
                                isRouteActive ? 'border-blue-500 bg-blue-50/40 ring-1 ring-blue-400' : 'border-gray-100 hover:border-blue-200 hover:bg-blue-50/20'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform ${
                                  isRouteActive ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600'
                                }`}>
                                  <Building2 size={14} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="font-bold text-gray-900 text-xs truncate leading-tight" title={fac.name}>
                                    {fac.name}
                                  </div>
                                  <div className="flex items-center gap-1.5 text-[10px] font-medium text-gray-500 mt-0.5 whitespace-nowrap">
                                    <span title="Jalan Kaki">🚶 {walkText}</span>
                                    <span className="text-gray-300">•</span>
                                    <span title="Sepeda Motor">🏍️ {motoText}</span>
                                    <span className="text-gray-300">•</span>
                                    <span title="Mobil">🚗 {carText}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="font-bold text-blue-600 bg-blue-50 border border-blue-100/80 px-2 py-0.5 rounded-lg text-[10px] whitespace-nowrap">
                                  {fac.distance}
                                </span>

                                {fac.lat && fac.lng ? (
                                  <button
                                    type="button"
                                    onClick={() => handleSelectRoute({
                                      name: fac.name,
                                      lat: fac.lat,
                                      lng: fac.lng,
                                      type: 'facility',
                                      distance: fac.distance,
                                      walkDuration: walkText,
                                      motoDuration: motoText,
                                      carDuration: carText
                                    })}
                                    className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all active:scale-95 shadow-2xs cursor-pointer ${
                                      isRouteActive 
                                        ? 'bg-blue-600 text-white border border-blue-600 shadow-sm' 
                                        : 'text-blue-600 hover:text-white bg-blue-50 hover:bg-blue-600 border border-blue-100/60 hover:border-blue-600'
                                    }`}
                                    title={isRouteActive ? 'Klik untuk sembunyikan rute' : 'Tampilkan rute pada peta mini di atas'}
                                  >
                                    <Navigation size={10} className={`shrink-0 ${isRouteActive ? 'rotate-45' : ''}`} />
                                    <span>{isRouteActive ? 'Aktif ✓' : 'Rute'}</span>
                                  </button>
                                ) : null}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </InfoSection>
            )}

            {/* Lapor Listing Banner Card */}
            <div className="bg-gray-50/80 rounded-3xl p-6 border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <ShieldAlert size={20} />
                </div>
                <div className="space-y-0.5">
                  <h4 className="font-black text-gray-900 text-sm">Menemukan Masalah pada Properti Ini?</h4>
                  <p className="text-xs text-gray-500">Laporkan jika ada indikasi penipuan, ketidaksesuaian harga, atau fasilitas palsu.</p>
                </div>
              </div>
              <button
                onClick={handleOpenReportModal}
                className="px-5 py-2.5 bg-white hover:bg-rose-50 border border-gray-200 hover:border-rose-200 text-gray-700 hover:text-rose-600 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap active:scale-95 flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Flag size={13} /> Laporkan Properti
              </button>
            </div>

          </div>

          {/* Right Sidebar - Booking Card */}
          <div className="relative">
            <div className="lg:sticky lg:top-20">
              <div className="bg-white rounded-[2rem] lg:rounded-[2.5rem] p-5 sm:p-6 lg:p-7 border border-gray-100 shadow-xl shadow-gray-100/50 lg:max-h-[calc(100vh-5.5rem)] lg:overflow-y-auto lg:overscroll-contain lg:pr-5 lg:scrollbar-thin lg:scrollbar-thumb-orange-200">
                <div className="mb-6">
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">Harga Sewa</p>
                  <div className="flex flex-col">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-gray-900 tracking-tighter">{FORMAT_CURRENCY(activePrice)}</span>
                      <span className="text-xs font-bold text-gray-400">/{selectedPeriod.replace('bulanan', 'bulan').replace('harian', 'hari').replace('mingguan', 'minggu').replace('tahunan', 'tahun')}</span>
                    </div>
                    {/* Dynamic Discount Badge in Header if current period is selected */}
                    {selectedRoom.pricing?.map(p => {
                      if (p.period === selectedPeriod) {
                        const discount = calculateDiscount(p);
                        if (discount > 0) {
                          return (
                            <div key={p.period} className="mt-2">
                              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                                Hemat {discount}%
                              </span>
                            </div>
                          )
                        }
                      }
                      return null;
                    })}
                  </div>

                  {/* Additional Fee Display */}
                  {kost.additionalFeePrice && kost.additionalFeePrice > 0 ? (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Biaya Tambahan</p>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900">+{FORMAT_CURRENCY(kost.additionalFeePrice)} <span className="text-xs font-medium text-gray-500">/bulan</span></span>
                        {kost.additionalFeeName && (
                          <p className="text-xs text-gray-500 mt-1 leading-relaxed">{kost.additionalFeeName}</p>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* Parent-Child Room Type & Room Number Selection */}
                {parentRoomGroups.length > 0 && (
                  <div className="mb-6">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                      PILIH TIPE KAMAR
                    </label>
                    <div className="space-y-3">
                      {parentRoomGroups.map((group, pIdx) => {
                        const isSelectedParent = selectedParentTypeIdx === pIdx;
                        return (
                          <div
                            key={pIdx}
                            onClick={() => {
                              setSelectedParentTypeIdx(pIdx);
                              const firstChild = group.rooms.find(r => r.isAvailable) || group.rooms[0];
                              if (firstChild) {
                                setSelectedVariantIdx(firstChild.variantIdx);
                                if (firstChild.isAvailable) {
                                  setActivePhotoFilter(firstChild.id);
                                  setCurrentPhoto(0);
                                }
                              }
                            }}
                            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all relative ${isSelectedParent
                                ? 'border-orange-500 bg-orange-50/40 shadow-sm ring-1 ring-orange-500/30'
                                : 'border-gray-150 hover:border-orange-200 bg-white'
                              }`}
                          >
                            <div className="flex justify-between items-start mb-1">
                              <span className="text-xs font-black uppercase tracking-tight text-gray-900 flex items-center gap-1.5">
                                <Layers size={14} className={isSelectedParent ? "text-orange-500" : "text-gray-400"} />
                                {group.typeName}
                              </span>
                              {/* Availability Badge */}
                              <div className={`text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${group.isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${group.isAvailable ? 'bg-green-600' : 'bg-red-600'}`}></div>
                                {kost.isManaged ? (
                                  group.isAvailable ? `${group.availableCount} Kamar Tersedia` : 'Penuh'
                                ) : (
                                  group.isAvailable ? 'Tersedia' : 'Penuh'
                                )}
                              </div>
                            </div>

                            {/* Price */}
                            <p className="text-xs font-medium text-gray-500 mb-2">
                              Mulai {FORMAT_CURRENCY(group.minPrice)} /bln
                            </p>

                            {/* Specs/Features */}
                            <div className="flex flex-wrap gap-1.5 mb-1">
                              <span className="text-[9px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md border border-gray-200">
                                {group.size}
                              </span>
                              {group.roomFacilities.slice(0, 2).map((fac, fIdx) => (
                                <span key={fIdx} className="text-[9px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md border border-gray-200 truncate max-w-[130px]">
                                  {fac}
                                </span>
                              ))}
                            </div>

                            {/* INTERACTIVE CHIP / PILL GRID: Nomor Kamar Tersedia */}
                            {kost.isManaged && isSelectedParent && (
                              <div className="mt-3 pt-3 border-t border-orange-200/70 flex flex-col gap-2 animate-in fade-in duration-200" onClick={e => e.stopPropagation()}>
                                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider">
                                  <span className="flex items-center gap-1.5 text-orange-950 font-extrabold">
                                    <Bed size={13} className="text-orange-500" />
                                    PILIH NOMOR KAMAR:
                                  </span>
                                  <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                                    {group.availableCount} Unit Tersedia
                                  </span>
                                </div>

                                {(() => {
                                  const availableRooms = group.rooms.filter(r => r.isAvailable);
                                  if (availableRooms.length === 0) {
                                    return (
                                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-center">
                                        <p className="text-xs font-bold text-rose-600">Semua kamar pada tipe ini sedang penuh</p>
                                      </div>
                                    );
                                  }

                                  return (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                      {availableRooms.map((room) => {
                                        const isSelected = selectedChildRoom?.id === room.id;
                                        return (
                                          <button
                                            key={room.id}
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setSelectedVariantIdx(room.variantIdx);
                                              setActivePhotoFilter(room.id);
                                              setCurrentPhoto(0);
                                            }}
                                            className={`p-2.5 rounded-xl border text-left transition-all relative flex flex-col justify-between cursor-pointer group/chip ${isSelected
                                                ? 'bg-orange-500 border-orange-600 text-white shadow-sm ring-2 ring-orange-500/20'
                                                : 'bg-white hover:bg-orange-50/60 border-slate-200 hover:border-orange-300 text-slate-800'
                                              }`}
                                          >
                                            <div className="flex items-center justify-between gap-1 mb-1">
                                              <span className={`text-xs font-black tracking-tight ${isSelected ? 'text-white' : 'text-slate-900 group-hover/chip:text-orange-600'}`}>
                                                {room.displayName}
                                              </span>
                                              {isSelected ? (
                                                <CheckCircle2 size={13} className="text-white shrink-0" />
                                              ) : (
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                                              )}
                                            </div>

                                            <span className={`text-[10px] font-semibold block ${isSelected ? 'text-orange-100' : 'text-slate-500'}`}>
                                              {room.floor || 'Lantai 1'}
                                            </span>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  );
                                })()}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Pricing Period Selector (Only if room has multiple pricing options) */}
                {selectedRoom.pricing && selectedRoom.pricing.length > 0 && (
                  <div className="mb-6">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Pilih Durasi Sewa</label>
                    <div className="flex flex-wrap gap-2">
                      {selectedRoom.pricing.map((scheme) => {
                        const discount = calculateDiscount(scheme);
                        return (
                          <button
                            key={scheme.period}
                            onClick={() => setSelectedPeriod(scheme.period)}
                            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all relative ${selectedPeriod === scheme.period
                              ? 'bg-gray-900 text-white border-gray-900'
                              : 'bg-white text-gray-500 border-gray-200 hover:border-orange-500'
                              }`}
                          >
                            {periodLabels[scheme.period] || scheme.period}
                            {discount > 0 && (
                              <span className="absolute -top-2 -right-2 bg-green-500 text-white text-[8px] px-1.5 rounded-full z-10">
                                -{discount}%
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Facilities of Selected Room - Structured Display */}
                <div className="mb-8 p-5 bg-gray-50/80 rounded-2xl border border-gray-100 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                      <Bed size={13} className="text-orange-500" />
                      Fasilitas {selectedRoom.name}
                    </p>
                    {selectedRoom.size && (
                      <span className="text-[10px] font-extrabold bg-white px-2 py-0.5 rounded-md border border-gray-200 text-gray-700 shadow-2xs">
                        {selectedRoom.size}
                      </span>
                    )}
                  </div>

                  {structuredRoomFacilities.isKosongan ? (
                    <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-center space-y-1">
                      <p className="text-xs font-black text-amber-900 flex items-center justify-center gap-1.5">
                        <AlertCircle size={14} className="text-amber-600 shrink-0" />
                        Kosongan (Tanpa Perabot)
                      </p>
                      <p className="text-[10px] text-amber-700 font-medium leading-relaxed">
                        Kamar disewakan dalam kondisi kosongan tanpa kasur & perabot kamar.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Sub 1: Perabot Kamar */}
                      {structuredRoomFacilities.bedroomItems.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">
                            Perabot & Ruangan
                          </span>
                          <div className="grid grid-cols-2 gap-1.5">
                            {structuredRoomFacilities.bedroomItems.map((item, idx) => (
                              <div key={idx} className="flex items-center gap-1.5 text-xs font-bold text-gray-700 bg-white px-2.5 py-1.5 rounded-xl border border-gray-100 shadow-2xs">
                                {structuredRoomFacilities.getRoomItemIcon(item)}
                                <span className="truncate" title={item}>{item}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Sub 2: Kamar Mandi */}
                      {structuredRoomFacilities.bathroomItems.length > 0 && (
                        <div className="space-y-1.5 pt-1 border-t border-gray-200/60">
                          <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">
                            Kamar Mandi
                          </span>
                          <div className="grid grid-cols-2 gap-1.5">
                            {structuredRoomFacilities.bathroomItems.map((item, idx) => (
                              <div key={idx} className="flex items-center gap-1.5 text-xs font-bold text-gray-700 bg-white px-2.5 py-1.5 rounded-xl border border-gray-100 shadow-2xs">
                                <Bath size={13} className="text-blue-500 shrink-0" />
                                <span className="truncate" title={item}>{item}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Sub 3: Dapur Kamar (jika ada Dapur Dalam) */}
                      {structuredRoomFacilities.kitchenItems.length > 0 && (
                        <div className="space-y-1.5 pt-1 border-t border-gray-200/60">
                          <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">
                            Dapur Pribadi
                          </span>
                          <div className="grid grid-cols-2 gap-1.5">
                            {structuredRoomFacilities.kitchenItems.map((item, idx) => (
                              <div key={idx} className="flex items-center gap-1.5 text-xs font-bold text-gray-700 bg-white px-2.5 py-1.5 rounded-xl border border-gray-100 shadow-2xs">
                                <CookingPot size={13} className="text-amber-500 shrink-0" />
                                <span className="truncate" title={item}>{item}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {hideBookingAndChat ? (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-1.5">
                    <div className="text-xs font-black text-amber-900 flex items-center justify-center gap-1.5">
                      <Clock size={14} className="text-amber-600" /> Mode Pratinjau Mitra
                    </div>
                    <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
                      Tombol transaksi sewa dan chat calon penyewa dinonaktifkan dalam mode pratinjau mitra.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(() => {
                      const isUnpublished = kost.status !== 'published';
                      const isManaged = Boolean(kost.isManaged);
                      const isAvailable = isManaged
                        ? Boolean(selectedChildRoom && selectedChildRoom.isAvailable)
                        : Boolean(selectedRoom && selectedRoom.isAvailable !== false);

                      const buttonText = isUnpublished
                        ? 'Pratinjau (Belum Tayang)'
                        : isManaged
                          ? (!selectedChildRoom
                              ? 'Pilih Kamar'
                              : !selectedChildRoom.isAvailable
                                ? 'Kamar Penuh'
                                : `Ajukan Sewa ${selectedChildRoom.displayName}`)
                          : (!isAvailable
                              ? 'Kamar Penuh'
                              : `Ajukan Sewa (${periodLabels[selectedPeriod] || selectedPeriod})`);

                      return (
                        <button
                          onClick={isUnpublished ? () => alert('Ini adalah mode pratinjau pemilik. Calon penyewa belum dapat mengajukan sewa sampai listing disetujui dan berstatus tayang publik oleh admin.') : handleBookingClick}
                          disabled={!isAvailable && !isUnpublished}
                          className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl transition-all active:scale-95 ${
                            isUnpublished
                              ? 'bg-amber-500 text-white shadow-amber-100 hover:bg-amber-600 cursor-pointer'
                              : !isAvailable
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                                : 'bg-orange-500 text-white shadow-orange-100 hover:bg-orange-600 cursor-pointer'
                          }`}
                        >
                          {buttonText}
                        </button>
                      );
                    })()}
                    <button
                      onClick={handleOpenChat}
                      disabled={isSubmittingChat}
                      className="w-full bg-white text-gray-900 border-2 border-gray-100 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:border-gray-900 transition-all active:scale-95 disabled:opacity-50"
                    >
                      {isSubmittingChat ? 'Membuka Chat...' : 'Chat Pemilik'}
                    </button>

                    <button
                      onClick={handleOpenReportModal}
                      className="w-full text-gray-400 hover:text-rose-600 font-bold text-xs flex items-center justify-center gap-1.5 py-2 hover:bg-rose-50/50 rounded-xl transition-all cursor-pointer"
                    >
                      <Flag size={12} />
                      <span>Laporkan Properti</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {isBookingModalOpen && (
        <BookingModal
          kost={kost}
          variant={selectedRoom}
          initialPeriod={selectedPeriod}
          onClose={() => setIsBookingModalOpen(false)}
          onConfirm={handleConfirmBooking}
        />
      )}

      {isPaymentGatewayOpen && tempBookingData && (
        <PaymentGateway
          amount={tempBookingData.total}
          orderId={`BOOK-${kost.id.substring(0, 4).toUpperCase()}-${Date.now().toString().substring(8)}`}
          productId={kost.id}
          productType="kost_booking"
          userId={user?.id}
          metadata={{
            userName: user?.displayName || user?.name || 'Customer',
            userEmail: user?.email || '',
            userPhone: user?.phoneNumber || user?.phone || '',
            userAddress: user?.address || '',
            bill_name: `Booking Kost: ${kost.title}`,
            kostName: kost.title,
            periodLabel: periodLabels[selectedPeriod] || selectedPeriod,
            roomType: tempBookingData.variantName,
            startDate: tempBookingData.startDate,
            endDate: (() => {
              const d = new Date(tempBookingData.startDate);
              const p = tempBookingData.period;
              if (p === 'harian') d.setDate(d.getDate() + 1);
              else if (p === 'mingguan') d.setDate(d.getDate() + 7);
              else if (p === 'bulanan') d.setMonth(d.getMonth() + 1);
              else if (p === '3bulanan') d.setMonth(d.getMonth() + 3);
              else if (p === '6bulanan') d.setMonth(d.getMonth() + 6);
              else if (p === 'tahunan') d.setFullYear(d.getFullYear() + 1);
              return d.toISOString().split('T')[0];
            })(),
            ...tempBookingData
          }}
          isAdmin={user?.role === 'admin'}
          onPaymentSuccess={handlePaymentSuccess}
          onCancel={() => setIsPaymentGatewayOpen(false)}
        />
      )}

      {showChatWindow && activeChatSession && (() => {
        const isManagedProp = Boolean(
          (kost as any).isManaged || 
          (kost as any).is_managed || 
          (kost as any).kostManager?.status === 'ACTIVE' || 
          (kost as any).kostManager?.isActive
        );
        return (
          <ChatWindow
            session={activeChatSession}
            currentUser={user}
            onClose={() => setShowChatWindow(false)}
            propertyName={kost.title || (kost as any).name || 'Kost'}
            contactName={isManagedProp ? 'Tim KostManager RuangSinggah' : (kost.omnichannelContactName || 'Pemilik Kost')}
            contactType={isManagedProp ? 'caretaker' : (kost.omnichannelContactType || 'owner')}
          />
        );
      })()}

      {/* MODAL LAPORKAN PROPERTI */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/70 backdrop-blur-sm animate-in fade-in" onClick={() => setIsReportModalOpen(false)} />
          <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col z-10 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 sm:p-7 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-rose-50/50 via-white to-white">
              <div className="space-y-0.5">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-rose-50 text-rose-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                  <ShieldAlert size={12} />
                  Layanan Pengaduan
                </div>
                <h3 className="text-xl font-black text-gray-900 tracking-tight">
                  Laporkan Properti
                </h3>
                <p className="text-xs text-gray-500 font-medium truncate max-w-[280px]">
                  {kost.title || (kost as any).namaKost}
                </p>
              </div>
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="w-9 h-9 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 sm:p-7 overflow-y-auto max-h-[75vh]">
              {reportSuccess ? (
                <div className="py-8 text-center space-y-4">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                    <Check size={32} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-lg font-black text-gray-900">Laporan Berhasil Terkirim!</h4>
                    <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
                      Terima kasih atas kepedulian Anda. Tim Moderasi RuangSinggah akan segera meninjau laporan ini dan mengambil tindakan tegas.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsReportModalOpen(false)}
                    className="px-6 py-3 bg-gray-900 hover:bg-black text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-md transition-all active:scale-95"
                  >
                    Tutup
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitReport} className="space-y-4 text-left">
                  {/* Pilihan Kategori */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
                      Pilih Masalah Utama <span className="text-rose-500">*</span>
                    </label>
                    <div className="space-y-1.5">
                      {categoryOptions.map(cat => {
                        const isSelected = reportCategory === cat.id;
                        return (
                          <div
                            key={cat.id}
                            onClick={() => setReportCategory(cat.id)}
                            className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                              isSelected
                                ? 'bg-rose-50/50 border-rose-400 ring-2 ring-rose-200'
                                : 'bg-gray-50/60 hover:bg-gray-50 border-gray-200/80 text-gray-700'
                            }`}
                          >
                            <span className="text-lg">{cat.icon}</span>
                            <span className={`text-xs font-bold ${isSelected ? 'text-rose-900' : 'text-gray-700'}`}>
                              {cat.label}
                            </span>
                            <input
                              type="radio"
                              name="reportCategory"
                              checked={isSelected}
                              onChange={() => setReportCategory(cat.id)}
                              className="ml-auto accent-rose-600"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Penjelasan Detail */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
                      Rincian / Kronologi Masalah <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      required
                      value={reportDescription}
                      onChange={e => setReportDescription(e.target.value)}
                      placeholder="Jelaskan secara singkat apa yang tidak sesuai atau kronologi masalah yang Anda alami..."
                      className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all min-h-[90px]"
                    />
                  </div>

                  {/* Info Pelapor (Nama & WhatsApp) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
                        Nama Anda
                      </label>
                      <div className="relative">
                        <UserIcon size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={reporterName}
                          onChange={e => setReporterName(e.target.value)}
                          placeholder="Nama lengkap"
                          className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
                        No. WhatsApp <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="tel"
                          required
                          value={reporterPhone}
                          onChange={e => setReporterPhone(e.target.value)}
                          placeholder="08123456789"
                          className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Unggah Bukti Foto (WebP) */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
                      Lampirkan Foto Bukti (Opsional)
                    </label>
                    <div className="flex items-center gap-3">
                      <label className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 flex items-center gap-2 cursor-pointer transition-all active:scale-95">
                        <Upload size={14} />
                        <span>{reportEvidenceFile ? 'Ganti Foto' : 'Pilih Foto Bukti'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleEvidenceChange}
                          className="hidden"
                        />
                      </label>
                      {reportEvidencePreview && (
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shadow-sm shrink-0">
                          <img src={reportEvidencePreview} alt="Bukti" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => { setReportEvidenceFile(null); setReportEvidencePreview(''); }}
                            className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-3 border-t border-gray-100 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setIsReportModalOpen(false)}
                      className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingReport}
                      className="flex-1 py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-rose-200 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isSubmittingReport ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Mengirim...</span>
                        </>
                      ) : (
                        <>
                          <Send size={14} />
                          <span>Kirim Laporan</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KostDetail;
