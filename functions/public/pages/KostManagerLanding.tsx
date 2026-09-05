import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase';
import { 
    CheckCircle2, ShieldCheck, Video, MapPin, FileText, ArrowRight, ArrowLeft,
    Briefcase, Sparkles, TrendingUp, Wallet, Zap, Play, X, Star, Users, Menu,
    Building, Building2, PlusCircle, DoorOpen, Bed, Check, ExternalLink,
    Layers, Shield, Info, Navigation, Calendar, Image as ImageIcon, ChevronRight,
    Compass, CheckCircle, RefreshCw
} from 'lucide-react';
import { Page, KostManagerPackage } from '../types';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PaymentGateway from '../components/PaymentGateway';
import { getKostManagerPackages } from '../adminService';
import { FORMAT_CURRENCY } from '../constants';

const getKostCoverImage = (kost: any): string => {
  if (!kost) return '';
  const rawImages = kost.image_urls || kost.images || [];
  if (Array.isArray(rawImages) && rawImages.length > 0) {
    const first = rawImages[0];
    if (typeof first === 'string') return first;
    if (first && typeof first === 'object') return first.url || first.original || first.src || '';
  }
  if (kost.image_url) return kost.image_url;
  return '';
};

// Google Maps LocationPicker Component
const LocationPicker: React.FC<{ lat: number; lng: number; onLocationChange: (lat: number, lng: number, address: string) => void }> = ({ lat, lng, onLocationChange }) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const mapInstance = useRef<any>(null);
    const markerInstance = useRef<any>(null);
    const geocoderInstance = useRef<any>(null);
    const [searchQuery, setSearchQuery] = useState("");

    const reverseGeocode = (latVal: number, lngVal: number) => {
        if (!geocoderInstance.current) return;
        geocoderInstance.current.geocode({ location: { lat: latVal, lng: lngVal } }, (results: any[], status: string) => {
            if (status === 'OK' && results[0]) {
                const addressStr = results[0].formatted_address;
                setSearchQuery(addressStr);
                onLocationChange(latVal, lngVal, addressStr);
            } else {
                onLocationChange(latVal, lngVal, `GPS: ${latVal.toFixed(6)}, ${lngVal.toFixed(6)}`);
            }
        });
    };

    useEffect(() => {
        if (!mapContainerRef.current) return;
        if (mapInstance.current) return;

        const google = (window as any).google;
        if (!google?.maps) {
            console.error("Google Maps API not loaded");
            return;
        }

        const initialLatLng = { lat, lng };

        const map = new google.maps.Map(mapContainerRef.current, {
            center: initialLatLng,
            zoom: 15,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            gestureHandling: 'greedy',
        });

        const marker = new google.maps.Marker({
            position: initialLatLng,
            map,
            draggable: true,
        });

        geocoderInstance.current = new google.maps.Geocoder();

        marker.addListener('dragend', () => {
            const pos = marker.getPosition();
            reverseGeocode(pos.lat(), pos.lng());
        });

        map.addListener('click', (e: any) => {
            marker.setPosition(e.latLng);
            reverseGeocode(e.latLng.lat(), e.latLng.lng());
        });

        mapInstance.current = map;
        markerInstance.current = marker;

        if (searchInputRef.current) {
            const autocomplete = new google.maps.places.Autocomplete(searchInputRef.current, {
                componentRestrictions: { country: 'id' },
                fields: ['geometry', 'formatted_address'],
            });
            autocomplete.addListener('place_changed', () => {
                const place = autocomplete.getPlace();
                if (!place.geometry?.location) return;
                const newLat = place.geometry.location.lat();
                const newLng = place.geometry.location.lng();
                map.setCenter({ lat: newLat, lng: newLng });
                map.setZoom(17);
                marker.setPosition({ lat: newLat, lng: newLng });
                setSearchQuery(place.formatted_address || '');
                onLocationChange(newLat, newLng, place.formatted_address || '');
            });
        }
    }, []);

    useEffect(() => {
        if (markerInstance.current && mapInstance.current) {
            const google = (window as any).google;
            if (!google?.maps) return;
            const currentPos = markerInstance.current.getPosition();
            if (!currentPos || Math.abs(currentPos.lat() - lat) > 0.0001 || Math.abs(currentPos.lng() - lng) > 0.0001) {
                markerInstance.current.setPosition({ lat, lng });
                mapInstance.current.setCenter({ lat, lng });
            }
        }
    }, [lat, lng]);

    return (
        <div className="flex flex-col gap-2">
            <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="🔍 Cari lokasi / nama jalan / nama tempat..."
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
            <div id="map-picker" ref={mapContainerRef} style={{ height: '220px', width: '100%', borderRadius: '1rem', zIndex: 0 }} />
        </div>
    );
};

interface KostManagerLandingProps {
  user?: any;
  onBack?: () => void;
  isEmbedded?: boolean;
}

const KostManagerLanding: React.FC<KostManagerLandingProps> = ({ user, onBack, isEmbedded }) => {
  const navigate = useNavigate();
  const isMitra = !!user && (user.role === 'owner' || user.role === 'mitra');
  const [searchParams, setSearchParams] = useSearchParams();
  const urlOrderId = searchParams.get('orderId');

  const [formData, setFormData] = useState({
    kostName: '',
    kostType: '',
    totalRooms: '',
    emptyRooms: '',
    address: '',
    googleMapsLink: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const isModalOpen = searchParams.get('register') === 'true';
  const setIsModalOpen = (open: boolean) => {
    const params: any = {};
    if (open) params.register = 'true';
    if (urlOrderId) params.orderId = urlOrderId;
    setSearchParams(params);
  };
  const [hasAgreedMoU, setHasAgreedMoU] = useState(false);
  const [modalStep, setModalStep] = useState<'method' | 'form' | 'mou'>('method');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [mapCoords, setMapCoords] = useState({ lat: -5.147665, lng: 119.432731 }); // Default to Makassar or Jakarta

  // Billing Flow Integration
  const [showPayment, setShowPayment] = useState(() => !!urlOrderId);
  const [paymentMetadata, setPaymentMetadata] = useState<any>(null);

  // User Properties Selection for Existing Mitra (Case 1 vs Case 2)
  const [userKosts, setUserKosts] = useState<any[]>([]);
  const [selectedKostId, setSelectedKostId] = useState<string>('');
  const [isManualInput, setIsManualInput] = useState<boolean>(false);

  const [packages, setPackages] = useState<KostManagerPackage[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');

  // Load draft from localStorage on mount
  useEffect(() => {
    const draft = localStorage.getItem('kostmanager_onboarding_draft');
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        if (parsed.formData) setFormData(parsed.formData);
        if (parsed.isManualInput !== undefined) setIsManualInput(parsed.isManualInput);
        if (parsed.selectedKostId !== undefined) setSelectedKostId(parsed.selectedKostId);
        if (parsed.selectedPackageId !== undefined) setSelectedPackageId(parsed.selectedPackageId);
        if (parsed.hasAgreedMoU !== undefined) setHasAgreedMoU(parsed.hasAgreedMoU);
      } catch (e) {
        console.error('Failed to parse draft:', e);
      }
    }
  }, []);

  // Save draft on changes
  useEffect(() => {
    localStorage.setItem('kostmanager_onboarding_draft', JSON.stringify({
      formData,
      isManualInput,
      selectedKostId,
      selectedPackageId,
      hasAgreedMoU
    }));
  }, [formData, isManualInput, selectedKostId, selectedPackageId, hasAgreedMoU]);

  useEffect(() => {
    async function loadPackages() {
      const data = await getKostManagerPackages();
      const activePkgs = data.filter(d => d.is_active);
      setPackages(activePkgs);
      if (activePkgs.length > 0) {
        const annualPkg = activePkgs.find(p => p.duration_months === 12);
        setSelectedPackageId(annualPkg ? annualPkg.id : activePkgs[0].id);
      }
    }
    loadPackages();
  }, []);

  useEffect(() => {
    async function loadUserKosts() {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('properties')
          .select('id, title, type, room_types, address, city, area, location, is_managed, images, image_urls, image_url, price, price_monthly, price_yearly, status')
          .eq('owner_uid', user.uid || user.id);
        if (!error && data) {
          setUserKosts(data);
          if (data.length > 0) {
            setIsManualInput(false);
            // Pre-select the first one
            const first = data[0];
            setSelectedKostId(first.id);
            let totalRoomsCalculated = 0;
            if (first.room_types && Array.isArray(first.room_types)) {
              totalRoomsCalculated = first.room_types.reduce((acc: number, rt: any) => acc + (parseInt(rt.availableRoomCount) || 1), 0);
            }
            // Construct maps link from coordinates if available
            let mapsLink = '';
            if (first.location && first.location.lat && first.location.lng) {
              mapsLink = `https://www.google.com/maps?q=${first.location.lat},${first.location.lng}`;
              setMapCoords({ lat: Number(first.location.lat), lng: Number(first.location.lng) });
            }

            setFormData({
              kostName: first.title || '',
              kostType: first.type || '',
              totalRooms: totalRoomsCalculated > 0 ? String(totalRoomsCalculated) : '10',
              emptyRooms: '0',
              address: first.address || '',
              googleMapsLink: mapsLink
            });
          }
        }
      } catch (err) {
        console.error("Error loading user properties:", err);
      }
    }
    loadUserKosts();
  }, [user]);

  const handleKostSelection = (id: string) => {
    setSelectedKostId(id);
    if (id === 'NEW') {
      setIsManualInput(true);
      setFormData({
        kostName: '',
        kostType: '',
        totalRooms: '',
        emptyRooms: '',
        address: '',
        googleMapsLink: ''
      });
    } else {
      const selected = userKosts.find(k => k.id === id);
      if (selected) {
        setIsManualInput(false);
        let totalRoomsCalculated = 0;
        if (selected.room_types && Array.isArray(selected.room_types)) {
          totalRoomsCalculated = selected.room_types.reduce((acc: number, rt: any) => acc + (parseInt(rt.availableRoomCount) || 1), 0);
        }

        // Construct maps link from coordinates if available
        let mapsLink = '';
        if (selected.location && selected.location.lat && selected.location.lng) {
          mapsLink = `https://www.google.com/maps?q=${selected.location.lat},${selected.location.lng}`;
          setMapCoords({ lat: selected.location.lat, lng: selected.location.lng });
        }

        setFormData({
          kostName: selected.title || '',
          kostType: selected.type || '',
          totalRooms: totalRoomsCalculated > 0 ? String(totalRoomsCalculated) : '10',
          emptyRooms: '0',
          address: selected.address || '',
          googleMapsLink: mapsLink
        });
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGoBack = () => {
    if (onBack) {
      onBack();
    } else if (isMitra) {
      navigate(Page.DASHBOARD_MITRA);
    } else {
      navigate(-1);
    }
  };

  const checkIdentityVerification = (): boolean => {
    if (!user) {
      navigate('/login?role=owner&mode=register');
      return false;
    }
    if (user.verification_status !== 'verified') {
      alert('Syarat Mendaftar KostManager: Anda harus menyelesaikan verifikasi identitas terlebih dahulu. Anda akan dialihkan otomatis ke halaman profil untuk melengkapi data dan dokumen identitas.');
      if (isMitra) {
        navigate(`${Page.DASHBOARD_MITRA}/profile?edit=true&step=2`);
      } else {
        navigate('/profile?view=edit');
      }
      return false;
    }
    return true;
  };

  // Proteksi URL langsung (?register=true) agar tidak bisa bypass verifikasi identitas
  useEffect(() => {
    if (isModalOpen) {
      if (!user) {
        setIsModalOpen(false);
        navigate('/login?role=owner&mode=register');
      } else if (user.verification_status !== 'verified') {
        setIsModalOpen(false);
        alert('Syarat Mendaftar KostManager: Anda harus menyelesaikan verifikasi identitas terlebih dahulu. Anda akan dialihkan otomatis ke halaman profil untuk melengkapi data dan dokumen identitas.');
        if (isMitra) {
          navigate(`${Page.DASHBOARD_MITRA}/profile?edit=true&step=2`);
        } else {
          navigate('/profile?view=edit');
        }
      }
    }
  }, [isModalOpen, user, isMitra]);

  const handleOpenRegistration = () => {
    if (!checkIdentityVerification()) return;
    if (userKosts.length > 0) {
      setModalStep('method');
    } else {
      setModalStep('form');
      setIsManualInput(true);
    }
    setIsModalOpen(true);
  };

   const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation tidak didukung oleh browser Anda.');
      return;
    }
    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      setMapCoords({ lat: latitude, lng: longitude });
      try {
        const gw = (window as any).google;
        if (gw?.maps?.Geocoder) {
          const geocoder = new gw.maps.Geocoder();
          geocoder.geocode(
            { location: { lat: latitude, lng: longitude } },
            (results: any[], status: string) => {
              if (status === 'OK' && results && results.length > 0) {
                setFormData(prev => ({
                  ...prev,
                  address: results[0].formatted_address,
                  googleMapsLink: `https://www.google.com/maps?q=${latitude},${longitude}`
                }));
              } else {
                setFormData(prev => ({
                  ...prev,
                  address: `GPS: ${latitude}, ${longitude}`,
                  googleMapsLink: `https://www.google.com/maps?q=${latitude},${longitude}`
                }));
              }
              setIsDetectingLocation(false);
            }
          );
        } else {
          setFormData(prev => ({
            ...prev,
            address: `GPS: ${latitude}, ${longitude}`,
            googleMapsLink: `https://www.google.com/maps?q=${latitude},${longitude}`
          }));
          setIsDetectingLocation(false);
        }
      } catch (error) {
        setFormData(prev => ({
          ...prev,
          address: `GPS: ${latitude}, ${longitude}`,
          googleMapsLink: `https://www.google.com/maps?q=${latitude},${longitude}`
        }));
      } finally {
        setIsDetectingLocation(false);
      }
    }, (error) => {
      setIsDetectingLocation(false);
      alert('Gagal mendapatkan lokasi GPS: ' + error.message);
    });
  };

  const selectedPkg = packages.find(p => p.id === selectedPackageId);
  const packagePrice = selectedPkg ? selectedPkg.price : 100000;
  const packageDuration = selectedPkg ? selectedPkg.duration_months : 12;
  const packageLabel = selectedPkg ? selectedPkg.label : 'Tahunan';

  // Langkah 1: Validasi form dan lanjut ke Syarat & Ketentuan (MoU)
  const handleProceedToMoU = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkIdentityVerification()) return;
    if (!formData.kostName || !formData.kostType || !formData.totalRooms || !formData.emptyRooms || !formData.address) {
      alert('Mohon lengkapi seluruh formulir data kost.');
      return;
    }

    const tRooms = parseInt(formData.totalRooms) || 0;
    const eRooms = parseInt(formData.emptyRooms) || 0;

    if (eRooms > tRooms) {
      alert('Jumlah kamar kosong tidak boleh melebihi jumlah total kamar.');
      return;
    }

    setModalStep('mou');
  };

  // Langkah 2: Persetujuan Syarat & Ketentuan dan Lanjut ke Pembayaran
  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkIdentityVerification()) return;
    if (!hasAgreedMoU) {
      alert('Mohon centang persetujuan Syarat & Ketentuan terlebih dahulu.');
      return;
    }

    const tRooms = parseInt(formData.totalRooms) || 0;
    const eRooms = parseInt(formData.emptyRooms) || 0;

    const meta: any = {
      userName: user.name || user.displayName || 'Pemilik Kost',
      userEmail: user.email || '',
      userPhone: user.phone || '',
      kostName: formData.kostName,
      kostType: formData.kostType,
      totalRooms: tRooms,
      emptyRooms: eRooms,
      address: formData.address,
      googleMapsLink: formData.googleMapsLink || '',
      propertyId: !isManualInput && selectedKostId !== 'NEW' ? selectedKostId : null,
      location: mapCoords,
      latitude: mapCoords.lat,
      longitude: mapCoords.lng,
      item: `Langganan KostManager - ${packageLabel}`,
      service_name: `KostManager ${packageLabel} Subscription`,
      package_price: packagePrice,
      duration_months: packageDuration,
      surveyDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Besok
      surveyTime: '10:00',
      notes: 'KostManager Onboarding'
    };

    setPaymentMetadata(meta);
    setShowPayment(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 font-sans overflow-x-hidden font-medium">
      {/* Sidebar Drawer for Mitra Context */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-[150] flex">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
          <aside className="relative w-72 bg-white h-full flex flex-col shadow-2xl z-10 animate-in slide-in-from-left duration-300">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center text-white font-black text-sm">
                  <Zap size={18} fill="currentColor" />
                </div>
                <div className="flex flex-col text-left">
                  <p className="text-xs font-black text-gray-900 leading-none tracking-tight uppercase">
                    <span className="text-orange-500">RuangSinggah</span>.id
                  </p>
                  <p className="text-[8px] font-black text-orange-500 uppercase tracking-widest mt-0.5">Mitra Dashboard</p>
                </div>
              </div>
              <button onClick={() => setIsSidebarOpen(false)} className="p-2 rounded-xl hover:bg-gray-50">
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            <nav className="flex-grow p-4 space-y-1 overflow-y-auto text-left">
              <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.2em] px-4 mb-3">Menu Dashboard</p>
              {[
                { label: 'Beranda / Overview', path: '/dashboard-mitra/overview' },
                { label: 'Kost Saya / Listings', path: '/dashboard-mitra/properties' },
                { label: 'Pesanan / Bookings', path: '/dashboard-mitra/bookings' },
                { label: 'Penghuni Aktif / Tenants', path: '/dashboard-mitra/tenants' },
                { label: 'Pesan / Chat', path: '/dashboard-mitra/chat' },
                { label: 'Dompet / Wallet', path: '/dashboard-mitra/wallet' },
                { label: 'Profil Saya / Profile', path: '/dashboard-mitra/profile' },
              ].map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    setIsSidebarOpen(false);
                    navigate(item.path);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                >
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 lg:pt-24 lg:pb-36 overflow-hidden bg-gradient-to-b from-orange-50 via-white to-white">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-400 rounded-full blur-[120px] opacity-10 -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-400 rounded-full blur-[120px] opacity-10 translate-y-1/3 -translate-x-1/3"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Back & Burger Button Container */}
          <div className="mb-6 flex items-center gap-3 justify-start">
            {isMitra && !isEmbedded && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="inline-flex items-center justify-center p-2.5 rounded-xl bg-white hover:bg-slate-100 text-gray-700 hover:text-orange-500 border border-slate-200/60 shadow-sm active:scale-95 transition-all"
                title="Buka Menu Dashboard"
              >
                <Menu size={18} className="stroke-[2.5]" />
              </button>
            )}
            <button
              onClick={handleGoBack}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-gray-700 hover:text-orange-500 font-bold text-xs uppercase tracking-wider transition-all duration-300 border border-slate-200/60 shadow-sm active:scale-95 cursor-pointer"
            >
              <ArrowLeft size={14} className="stroke-[3]" />
              <span>{isMitra ? 'Kembali ke Dashboard Mitra' : (onBack ? 'Kembali ke Pilihan' : 'Kembali')}</span>
            </button>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Kiri: Deskripsi & Keunggulan */}
            <div className="text-center lg:text-left space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-800 rounded-full text-xs font-black uppercase tracking-wider shadow-sm">
                <Zap size={14} fill="currentColor" className="text-orange-500" />
                <span>Solusi Kelola Kost Tanpa Pusing</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-gray-900">
                Capek Urus Kost Sendirian? Saatnya Properti Anda Berjalan <span className="text-orange-500">Auto-Pilot!</span>
              </h1>
              
              <p className="text-gray-600 text-sm sm:text-base lg:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0 font-medium">
                Lepaskan semua keribetan harian Anda. Mulai dari pembuatan foto & video promosi gratis oleh surveyor kami, pemasaran aktif di sosial media, hingga penagihan otomatis yang terjadwal. Anda tinggal santai dan terima bersih pendapatan kost langsung ke rekening.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <button
                  onClick={handleOpenRegistration}
                  className="w-full sm:w-auto px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest active:scale-[0.98] transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
                >
                  Mulai Auto-Pilot Kost Sekarang <ArrowRight size={16} />
                </button>
                <button
                  onClick={() => {
                    document.getElementById('pain-points-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full sm:w-auto px-8 py-4 bg-white text-gray-800 hover:bg-gray-50 rounded-2xl font-black text-sm uppercase tracking-widest active:scale-[0.98] transition-all flex items-center justify-center gap-2 border border-gray-200 shadow-sm"
                >
                  Pelajari Masalah & Solusi
                </button>
              </div>
            </div>

            {/* Kanan: Mock Video Player & Promo Tag */}
            <div className="relative w-full max-w-lg mx-auto lg:max-w-none">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-gray-100 bg-black aspect-video flex items-center justify-center group">
                <iframe
                  src="https://www.youtube.com/embed/J1lkBcwM6fw?playsinline=1&rel=0&modestbranding=1&controls=1"
                  title="Demo KostManager RuangSinggah.id"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full absolute inset-0"
                />
              </div>

              {/* Promo Badge Floating */}
              <div className="absolute -bottom-6 -right-4 bg-orange-500 p-4 rounded-3xl shadow-2xl border-4 border-white text-white font-black text-center animate-bounce animate-duration-1000" style={{ animationDuration: '4s' }}>
                <p className="text-[10px] uppercase tracking-wider opacity-90">Layanan Terbaik</p>
                <p className="text-base">100% Otomatis</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pain Points Section - EMPATHY BUILDING */}
      <section id="pain-points-section" className="py-20 bg-gray-50 border-t border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-orange-600 font-bold text-xs uppercase tracking-widest font-sans">Realita Pemilik Kost</span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 mt-2 font-sans">
              Apakah Anda Sering Pusing Mengurusi Hal Ini?
            </h2>
            <p className="text-gray-500 mt-4 text-sm sm:text-base font-medium">
              Mengelola kost sendiri sering kali terdengar mudah di awal, hingga berbagai keribetan harian ini mulai menyita waktu istirahat dan ketenangan pikiran Anda.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Lupa Tanggal Tagihan */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-sm space-y-3">
              <div className="text-3xl">📆</div>
              <h3 className="text-base font-black text-gray-900 font-sans">Lupa Tanggal Jatuh Tempo</h3>
              <p className="text-xs text-gray-500 leading-relaxed font-medium">
                Punya banyak kamar berarti punya tanggal tagihan berbeda-beda sesuai tanggal masuk penghuni. Sering kali luput atau terlambat menagih karena terlalu banyak jadwal yang harus diingat.
              </p>
            </div>

            {/* Iklan Sepi & Survey Visual */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-sm space-y-3">
              <div className="text-3xl">📸</div>
              <h3 className="text-base font-black text-gray-900 font-sans">Foto Iklan Kost Buram & Gelap</h3>
              <p className="text-xs text-gray-500 leading-relaxed font-medium">
                Kamar kost kosong berbulan-bulan hanya karena calon penyewa tidak tertarik melihat foto dan video seadanya yang diambil dengan ponsel biasa secara terburu-buru.
              </p>
            </div>

            {/* Sungkan Menagih */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-sm space-y-3">
              <div className="text-3xl">😤</div>
              <h3 className="text-base font-black text-gray-900 font-sans">Sungkan Menagih Uang Sewa</h3>
              <p className="text-xs text-gray-500 leading-relaxed font-medium">
                Merasa tidak enak hati, canggung, atau lelah harus terus-menerus mengirim chat WhatsApp pengingat kepada penghuni kost yang sering menunda-nunda pembayaran sewa bulanan.
              </p>
            </div>

            {/* Rekap Manual */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-sm space-y-3">
              <div className="text-3xl">📊</div>
              <h3 className="text-base font-black text-gray-900 font-sans">Pembukuan yang Selalu Selisih</h3>
              <p className="text-xs text-gray-500 leading-relaxed font-medium">
                Mencatat pengeluaran listrik, kebersihan, air, dan uang masuk di buku tulis manual yang rentan hilang atau di file Excel yang rumit dan melelahkan untuk diperbarui.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits-section" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-orange-600 font-bold text-xs uppercase tracking-widest font-sans">Jawaban Terbaik</span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 mt-2 font-sans">
              Bagaimana KostManager Menjadi Jawaban Anda?
            </h2>
            <p className="text-gray-500 mt-4 text-sm sm:text-base font-medium font-sans">
              Kami menggabungkan jasa survey visual profesional secara langsung dengan sistem otomatisasi platform untuk membebaskan Anda dari stres kelola kost.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* 1. Jasa Survey Visual Premium */}
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 space-y-4 hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/5 transition-all group duration-300">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 group-hover:bg-orange-500 group-hover:text-white transition-all duration-300">
                <Video size={24} />
              </div>
              <h3 className="text-lg font-black text-gray-900 font-sans">Foto & Video Premium Gratis</h3>
              <p className="text-xs text-gray-500 leading-relaxed font-medium">
                Tim surveyor kami datang langsung ke kost Anda untuk memotret dan merekam video promosi estetik secara **gratis**. Iklan kost Anda seketika terlihat profesional dan bernilai tinggi.
              </p>
            </div>

            {/* 2. Penagihan Sewa Otomatis & Terjadwal */}
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 space-y-4 hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/5 transition-all group duration-300">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 group-hover:bg-orange-500 group-hover:text-white transition-all duration-300">
                <Zap size={24} />
              </div>
              <h3 className="text-lg font-black text-gray-900 font-sans">Jadwal Tagihan yang Diingat Sistem</h3>
              <p className="text-xs text-gray-500 leading-relaxed font-medium">
                Sistem pintar otomatis melacak tanggal masuk setiap penghuni dan mengirimkan tagihan sewa bulanan tepat waktu. Anda tidak perlu lagi repot mengingat tanggal tagihan satu per satu.
              </p>
            </div>

            {/* 3. Pemasaran Sosmed Prioritas */}
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 space-y-4 hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/5 transition-all group duration-300">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 group-hover:bg-orange-500 group-hover:text-white transition-all duration-300">
                <TrendingUp size={24} />
              </div>
              <h3 className="text-lg font-black text-gray-900 font-sans">Pemasaran Sosmed RuangSinggah</h3>
              <p className="text-xs text-gray-500 leading-relaxed font-medium">
                Konten visual kost dari surveyor kami langsung diunggah ke website utama dan dipromosikan di TikTok serta Instagram kami agar cepat mendapatkan calon penyewa baru.
              </p>
            </div>

            {/* 4. Laporan Keuangan Live */}
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 space-y-4 hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/5 transition-all group duration-300">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 group-hover:bg-orange-500 group-hover:text-white transition-all duration-300">
                <Wallet size={24} />
              </div>
              <h3 className="text-lg font-black text-gray-900 font-sans">Laporan Live Tanpa Rekap Manual</h3>
              <p className="text-xs text-gray-500 leading-relaxed font-medium">
                Pantau total pendapatan kotor, status pembayaran lunas, dan laba bersih kost Anda secara live dari dashboard pemilik. Transparan, rapi, dan 100% akurat.
              </p>
            </div>

            {/* 5. Integrasi Data Kamar & Penghuni */}
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 space-y-4 hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/5 transition-all group duration-300">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 group-hover:bg-orange-500 group-hover:text-white transition-all duration-300">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-lg font-black text-gray-900 font-sans">Data Penyewa & Kamar Padu</h3>
              <p className="text-xs text-gray-500 leading-relaxed font-medium">
                Semua data identitas penghuni (KTP, kontak) dan nomor kamar yang ditempati sinkron secara otomatis. Anda selalu tahu persis siapa penghuni kamar nomor sekian secara akurat.
              </p>
            </div>

            {/* 6. Reservasi Instan & Booking Online */}
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 space-y-4 hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/5 transition-all group duration-300">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 group-hover:bg-orange-500 group-hover:text-white transition-all duration-300">
                <Users size={24} />
              </div>
              <h3 className="text-lg font-black text-gray-900 font-sans">Sewa Instan Online 24/7</h3>
              <p className="text-xs text-gray-500 leading-relaxed font-medium">
                Calon penyewa baru dapat memilih kamar kosong, menyerahkan berkas administrasi, dan menyewa kost secara online langsung dari website kami tanpa perlu Anda dampingi ke lokasi.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Offer Section */}
      <section className="py-20 bg-gray-50 border-t border-gray-100 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="max-w-md mx-auto bg-white border border-gray-200 rounded-3xl p-8 shadow-xl relative">
            <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 bg-orange-500 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-wider shadow">
              Investasi Terbaik Anda
            </div>
            
            <h3 className="text-2xl font-black mt-2 text-gray-900 font-sans">Paket KostManager</h3>

            {packages.length > 0 && (
              <div className="flex flex-wrap gap-1.5 justify-center mt-4">
                {packages.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPackageId(p.id)}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      selectedPackageId === p.id 
                        ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20' 
                        : 'bg-slate-50 hover:bg-slate-100 text-gray-600'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-baseline justify-center gap-1 my-6 font-sans">
              <span className="text-4xl sm:text-5xl font-black text-orange-500">{FORMAT_CURRENCY(packagePrice)}</span>
              <span className="text-gray-400 text-xs font-bold font-sans">/ {packageDuration === 12 ? 'tahun' : `${packageDuration} bulan`}</span>
            </div>

            <p className="text-xs text-gray-500 mb-6 font-medium leading-relaxed font-sans">
              Biaya super hemat untuk membebaskan Anda dari segala keribetan mengelola kost harian. Nilai yang sangat kecil demi ketenangan pikiran (*peace of mind*).
            </p>

            <ul className="space-y-4 text-left text-xs font-medium text-gray-600 mb-8 font-sans">
              <li className="flex items-center gap-3">
                <CheckCircle2 size={16} className="text-orange-500 shrink-0" />
                <span>Kunjungan Agent Survey langsung ke Kost</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 size={16} className="text-orange-500 shrink-0" />
                <span>Foto & Video Promosi Kost Profesional</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 size={16} className="text-orange-500 shrink-0" />
                <span>Posting ke Instagram/TikTok RuangSinggah</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 size={16} className="text-orange-500 shrink-0" />
                <span>Pencatatan Hunian & Kamar Terintegrasi</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 size={16} className="text-orange-500 shrink-0" />
                <span>Laporan Keuangan Otomatis & Transparan</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 size={16} className="text-orange-500 shrink-0" />
                <span>Keputusan Pemasaran & Penagihan Otomatis</span>
              </li>
            </ul>

            <button
              onClick={handleOpenRegistration}
              className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-orange-500/20 active:scale-[0.98] transition-all"
            >
              Langganan KostManager Sekarang
            </button>
          </div>
        </div>
      </section>

      {/* Bottom Back Button */}
      <div className="py-12 bg-white flex justify-center border-t border-gray-100">
        <button
          onClick={handleGoBack}
          className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white hover:bg-slate-50 text-gray-700 hover:text-orange-500 font-black text-sm uppercase tracking-widest transition-all duration-300 border border-gray-200 shadow-sm active:scale-95"
        >
          <ArrowLeft size={16} className="stroke-[3]" />
          <span>{onBack ? 'Kembali ke Pilihan Kemitraan' : (isMitra ? 'Kembali ke Dashboard' : 'Kembali')}</span>
        </button>
      </div>

      {/* Modal Formulir Pendaftaran */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6" style={{ width: '100vw', height: '100vh', position: 'fixed', top: 0, left: 0 }}>
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity" 
            onClick={() => !isSubmitting && setIsModalOpen(false)}
          />

          {/* Modal Card */}
          <div className="bg-white border border-slate-200/80 text-slate-900 w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[88vh] rounded-t-3xl sm:rounded-3xl shadow-2xl relative z-10 animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-300 flex flex-col overflow-hidden">
            
            {/* Top Accent Gradient Bar */}
            <div className="h-1.5 w-full bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 flex-shrink-0" />

            {/* Header */}
            <div className="px-5 sm:px-7 py-4 border-b border-slate-100 bg-slate-50/90 backdrop-blur-md flex-shrink-0">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Sparkles size={18} className="stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-black leading-tight text-slate-900">Langganan KostManager</h3>
                    <p className="text-[11px] sm:text-xs text-slate-500 font-medium">Layanan autopilot kelola properti kost eksklusif</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  aria-label="Tutup formulir"
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200/70 text-slate-600 hover:bg-rose-500 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Progress Step Indicator (3 Steps) */}
              <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between gap-2">
                {/* Step 1: Metode */}
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                    modalStep === 'method' 
                      ? 'bg-orange-500 text-white ring-4 ring-orange-500/20 shadow-xs' 
                      : 'bg-emerald-500 text-white'
                  }`}>
                    {modalStep !== 'method' ? <Check size={12} className="stroke-[3]" /> : '1'}
                  </div>
                  <span className={`text-xs font-bold ${modalStep === 'method' ? 'text-orange-600' : 'text-slate-700'}`}>
                    Pilih Metode
                  </span>
                </div>

                {/* Divider 1 */}
                <div className={`h-1 flex-1 max-w-[40px] sm:max-w-[70px] rounded-full transition-all ${
                  modalStep !== 'method' ? 'bg-orange-500' : 'bg-slate-200'
                }`} />

                {/* Step 2: Data Properti */}
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                    modalStep === 'form' 
                      ? 'bg-orange-500 text-white ring-4 ring-orange-500/20 shadow-xs' 
                      : (modalStep === 'mou' ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500')
                  }`}>
                    {modalStep === 'mou' ? <Check size={12} className="stroke-[3]" /> : '2'}
                  </div>
                  <span className={`text-xs font-bold ${
                    modalStep === 'form' ? 'text-orange-600' : (modalStep === 'mou' ? 'text-slate-700' : 'text-slate-400')
                  }`}>
                    Data Properti
                  </span>
                </div>

                {/* Divider 2 */}
                <div className={`h-1 flex-1 max-w-[40px] sm:max-w-[70px] rounded-full transition-all ${
                  modalStep === 'mou' ? 'bg-orange-500' : 'bg-slate-200'
                }`} />

                {/* Step 3: Syarat & MoU */}
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                    modalStep === 'mou' 
                      ? 'bg-orange-500 text-white ring-4 ring-orange-500/20 shadow-xs' 
                      : 'bg-slate-200 text-slate-500'
                  }`}>
                    3
                  </div>
                  <span className={`text-xs font-bold ${modalStep === 'mou' ? 'text-orange-600' : 'text-slate-400'}`}>
                    Syarat & MoU
                  </span>
                </div>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-7 bg-white space-y-6">
              
              {/* ========================================================================= */}
              {/* TAHAP 1: LAYAR DEDICATED PEMILIHAN METODE PENDAFTARAN                     */}
              {/* ========================================================================= */}
              {modalStep === 'method' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="text-center max-w-lg mx-auto space-y-1">
                    <h4 className="text-base sm:text-lg font-black text-slate-900">
                      Bagaimana Anda Ingin Mendaftarkan Kost?
                    </h4>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                      Silakan tentukan apakah Anda ingin mendaftarkan listing yang sudah ada atau mendaftarkan properti kost baru secara eksklusif.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 pt-1">
                    {/* Opsi A: Pilih dari Kost Saya */}
                    <div
                      onClick={() => {
                        setIsManualInput(false);
                        if (userKosts.length > 0 && !selectedKostId) {
                          handleKostSelection(userKosts[0].id);
                        } else if (selectedKostId && selectedKostId !== 'NEW') {
                          handleKostSelection(selectedKostId);
                        } else if (userKosts.length > 0) {
                          handleKostSelection(userKosts[0].id);
                        }
                      }}
                      className={`p-4 sm:p-5 rounded-3xl border-2 transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center gap-4 relative group ${
                        !isManualInput 
                          ? 'border-orange-500 bg-orange-50/50 shadow-md shadow-orange-500/10 ring-2 ring-orange-500/20' 
                          : 'border-slate-200 bg-white hover:border-orange-300 hover:bg-slate-50/60'
                      }`}
                    >
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors ${
                        !isManualInput ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20' : 'bg-slate-100 text-slate-600 group-hover:bg-orange-100 group-hover:text-orange-600'
                      }`}>
                        <Building2 size={26} />
                      </div>

                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h5 className="text-sm font-black text-slate-900">
                            Pilih dari Listing Kost Saya
                          </h5>
                          {userKosts.length > 0 ? (
                            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200">
                              {userKosts.length} Properti Tersedia
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                              Belum ada listing
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-500 font-medium leading-relaxed">
                          Daftarkan properti kost yang sudah ada di akun Anda ke program KostManager Autopilot. Data spesifikasi kamar, foto, dan lokasi GPS tersinkronisasi otomatis tanpa input ulang.
                        </p>

                        <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px] font-bold text-slate-600">
                          <span className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-2xs">
                            <CheckCircle2 size={12} className="text-emerald-600" /> Foto Otomatis
                          </span>
                          <span className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-2xs">
                            <CheckCircle2 size={12} className="text-emerald-600" /> Koordinat GPS
                          </span>
                          <span className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-2xs">
                            <CheckCircle2 size={12} className="text-emerald-600" /> Proses Instan
                          </span>
                        </div>
                      </div>

                      {/* Selection Radio Circle */}
                      <div className="self-end sm:self-center flex-shrink-0">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                          !isManualInput ? 'bg-orange-500 text-white shadow-sm' : 'border-2 border-slate-300 bg-white'
                        }`}>
                          {!isManualInput && <Check size={14} className="stroke-[3]" />}
                        </div>
                      </div>
                    </div>

                    {/* Opsi B: Daftarkan Kost Baru */}
                    <div
                      onClick={() => {
                        setIsManualInput(true);
                        handleKostSelection('NEW');
                      }}
                      className={`p-4 sm:p-5 rounded-3xl border-2 transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center gap-4 relative group ${
                        isManualInput 
                          ? 'border-orange-500 bg-orange-50/50 shadow-md shadow-orange-500/10 ring-2 ring-orange-500/20' 
                          : 'border-slate-200 bg-white hover:border-orange-300 hover:bg-slate-50/60'
                      }`}
                    >
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors ${
                        isManualInput ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20' : 'bg-slate-100 text-slate-600 group-hover:bg-orange-100 group-hover:text-orange-600'
                      }`}>
                        <PlusCircle size={26} />
                      </div>

                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h5 className="text-sm font-black text-slate-900">
                            Daftar Kost Baru Eksklusif (Manual)
                          </h5>
                          <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                            Input Baru
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 font-medium leading-relaxed">
                          Daftarkan unit properti kost baru yang belum pernah diunggah ke RuangSinggah.id. Anda akan dipandu untuk melengkapi informasi properti, titik lokasi peta, dan spesifikasi kamar dari awal.
                        </p>

                        <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px] font-bold text-slate-600">
                          <span className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-2xs">
                            <CheckCircle2 size={12} className="text-emerald-600" /> Formulir Mandiri
                          </span>
                          <span className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-2xs">
                            <CheckCircle2 size={12} className="text-emerald-600" /> Pinpoint Peta Google
                          </span>
                          <span className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-2xs">
                            <CheckCircle2 size={12} className="text-emerald-600" /> Registrasi Baru
                          </span>
                        </div>
                      </div>

                      {/* Selection Radio Circle */}
                      <div className="self-end sm:self-center flex-shrink-0">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                          isManualInput ? 'bg-orange-500 text-white shadow-sm' : 'border-2 border-slate-300 bg-white'
                        }`}>
                          {isManualInput && <Check size={14} className="stroke-[3]" />}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sticky Footer Tahap 1 */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3 bg-white sticky bottom-0">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => setIsModalOpen(false)}
                      className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs sm:text-sm font-bold transition-all disabled:opacity-50 cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!isManualInput) {
                          if (userKosts.length > 0 && !selectedKostId) {
                            handleKostSelection(userKosts[0].id);
                          } else if (selectedKostId && selectedKostId !== 'NEW') {
                            handleKostSelection(selectedKostId);
                          } else if (userKosts.length > 0) {
                            handleKostSelection(userKosts[0].id);
                          } else {
                            // Fallback if no kosts
                            setIsManualInput(true);
                            handleKostSelection('NEW');
                          }
                        } else {
                          handleKostSelection('NEW');
                        }
                        setModalStep('form');
                      }}
                      className="px-6 sm:px-8 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-orange-500/25 transition-all cursor-pointer"
                    >
                      <span>Lanjut ke Data Properti</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* TAHAP 2: FORMULIR / KONFIRMASI DATA PROPERTI                             */}
              {/* ========================================================================= */}
              {modalStep === 'form' && (
                <form onSubmit={handleProceedToMoU} className="space-y-6 animate-in fade-in duration-300">
                  
                  {/* Top Navigation & Method Indicator */}
                  <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                    <button
                      type="button"
                      onClick={() => setModalStep('method')}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-600 hover:text-orange-700 bg-white hover:bg-orange-50/50 px-3 py-1.5 rounded-xl border border-orange-200 transition-all cursor-pointer shadow-2xs"
                    >
                      <ArrowLeft size={13} className="stroke-[2.5]" />
                      <span>Ganti Pilihan Metode</span>
                    </button>

                    <div className="text-[11px] font-bold text-slate-500">
                      Metode: <strong className="text-slate-900">{!isManualInput ? 'Pilih dari Kost Saya' : 'Daftar Kost Baru (Manual)'}</strong>
                    </div>
                  </div>

                  {/* Kasus A: Jika Memilih "Pilih dari Kost Saya" */}
                  {!isManualInput && userKosts.length > 0 && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                      
                      {/* Daftar Pilihan Kost Card Grid */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                            <Building size={13} className="text-orange-500" />
                            Pilih Properti Kost ({userKosts.length})
                          </label>
                          <span className="text-[10px] text-orange-600 font-bold bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">
                            Klik kartu untuk memilih
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-56 overflow-y-auto p-1 border border-slate-100 rounded-2xl bg-slate-50/50">
                          {userKosts.map((kost) => {
                            const isSelected = kost.id === selectedKostId;
                            const coverImg = getKostCoverImage(kost);
                            let roomsCount = 0;
                            if (kost.room_types && Array.isArray(kost.room_types)) {
                              roomsCount = kost.room_types.reduce((acc: number, rt: any) => acc + (parseInt(rt.availableRoomCount) || 1), 0);
                            }

                            return (
                              <div
                                key={kost.id}
                                onClick={() => handleKostSelection(kost.id)}
                                className={`relative p-3 rounded-2xl border transition-all cursor-pointer flex gap-3 items-center text-left ${
                                  isSelected
                                    ? 'bg-orange-50/70 border-orange-500 shadow-md shadow-orange-500/10 ring-2 ring-orange-500/20'
                                    : 'bg-white border-slate-200/90 hover:border-orange-300 hover:shadow-sm'
                                }`}
                              >
                                {/* Thumbnail Image */}
                                <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0 relative">
                                  {coverImg ? (
                                    <img
                                      src={coverImg}
                                      alt={kost.title}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        (e.target as HTMLElement).style.display = 'none';
                                      }}
                                    />
                                  ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-orange-100 to-amber-100 text-orange-500">
                                      <Building2 size={20} />
                                    </div>
                                  )}
                                  {kost.is_managed && (
                                    <div className="absolute top-1 left-1 bg-emerald-600 text-white text-[8px] font-black px-1 rounded shadow-xs">
                                      KM
                                    </div>
                                  )}
                                </div>

                                {/* Details */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1 mb-0.5">
                                    <span className="text-xs font-black text-slate-900 truncate block">
                                      {kost.title}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium truncate mb-1">
                                    <MapPin size={10} className="text-slate-400 flex-shrink-0" />
                                    <span className="truncate">{kost.city || kost.address || 'Tanpa Alamat'}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                      {kost.type || 'Campur'}
                                    </span>
                                    {roomsCount > 0 && (
                                      <span className="text-[9px] font-bold text-slate-500 flex items-center gap-0.5">
                                        <DoorOpen size={10} /> {roomsCount} Kamar
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Active Selection Badge */}
                                <div className="flex-shrink-0 ml-1">
                                  {isSelected ? (
                                    <div className="w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-sm">
                                      <Check size={12} className="stroke-[3]" />
                                    </div>
                                  ) : (
                                    <div className="w-5 h-5 rounded-full border border-slate-300 bg-white" />
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Showcase Preview Properti Terpilih */}
                      {(() => {
                        const selectedKost = userKosts.find(k => k.id === selectedKostId);
                        if (!selectedKost) return null;

                        const coverImg = getKostCoverImage(selectedKost);
                        const hasLocation = selectedKost.location && (Number(selectedKost.location.lat) !== 0 || Number(selectedKost.location.lng) !== 0);
                        const embedUrl = hasLocation ? `https://maps.google.com/maps?q=${selectedKost.location.lat},${selectedKost.location.lng}&z=16&output=embed` : '';

                        return (
                          <div className="rounded-2xl border border-orange-200/90 bg-gradient-to-br from-orange-50/50 via-white to-amber-50/40 p-4 space-y-3.5 shadow-sm">
                            <div className="flex items-center justify-between border-b border-orange-100 pb-2.5">
                              <span className="text-[11px] font-black text-orange-800 uppercase tracking-wider flex items-center gap-1.5">
                                <Sparkles size={13} className="text-orange-500" />
                                Preview Properti Terpilih
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                <CheckCircle2 size={11} className="stroke-[2.5]" />
                                Data Tersinkronisasi
                              </span>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4">
                              {/* Big Cover Photo */}
                              <div className="w-full sm:w-44 h-28 sm:h-32 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0 relative group shadow-sm">
                                {coverImg ? (
                                  <img
                                    src={coverImg}
                                    alt={selectedKost.title}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                  />
                                ) : (
                                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-orange-100 via-amber-50 to-orange-100 text-orange-400">
                                    <ImageIcon size={28} className="mb-1 opacity-70" />
                                    <span className="text-[10px] font-bold text-slate-400">Foto Listing</span>
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent flex items-end p-2">
                                  <span className="text-[10px] font-black text-white px-2 py-0.5 rounded-md bg-orange-600/90 backdrop-blur-xs">
                                    {selectedKost.type || 'Kost'}
                                  </span>
                                </div>
                              </div>

                              {/* Info Box */}
                              <div className="flex-1 min-w-0 flex flex-col justify-between space-y-2">
                                <div>
                                  <h4 className="text-sm font-black text-slate-900 leading-tight line-clamp-1 mb-1">
                                    {selectedKost.title}
                                  </h4>
                                  <p className="text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed">
                                    {selectedKost.address || 'Alamat lengkap properti'}
                                  </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-bold text-slate-700">
                                  <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 shadow-2xs">
                                    Kota: <strong className="text-slate-900">{selectedKost.city || 'Makassar'}</strong>
                                  </span>
                                  <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 shadow-2xs">
                                    Kamar: <strong className="text-slate-900">{formData.totalRooms} Unit</strong>
                                  </span>
                                  {selectedKost.is_managed && (
                                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      KostManager Aktif
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Collapsible Mini Map */}
                            {hasLocation && (
                              <div className="pt-2 border-t border-orange-100/70">
                                <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-inner">
                                  <iframe
                                    title="Kost Location Map"
                                    width="100%"
                                    height="140"
                                    style={{ border: 0 }}
                                    loading="lazy"
                                    src={embedUrl}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Section: Detail Informasi Properti */}
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                      <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                        <FileText size={13} className="text-orange-500" />
                        {!isManualInput ? 'Konfirmasi Data Properti' : 'Formulir Properti Kost Baru'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Nama Kost <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            name="kostName"
                            required
                            value={formData.kostName}
                            onChange={handleChange}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none text-sm font-medium transition-all"
                            placeholder="Contoh: Kost Orange Residence"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Jenis Kost <span className="text-rose-500">*</span>
                        </label>
                        <select
                          name="kostType"
                          required
                          value={formData.kostType}
                          onChange={handleChange}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none text-sm appearance-none cursor-pointer font-medium transition-all"
                        >
                          <option value="" disabled>Pilih Jenis Kost</option>
                          <option value="Putra">Putra</option>
                          <option value="Putri">Putri</option>
                          <option value="Campur Biasa">Campur Biasa</option>
                          <option value="Campur/Pasutri">Campur/Pasutri</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Jumlah Total Kamar <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="number"
                          name="totalRooms"
                          min="1"
                          required
                          value={formData.totalRooms}
                          onChange={handleChange}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none text-sm font-medium transition-all"
                          placeholder="10"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Jumlah Kamar Kosong <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="number"
                          name="emptyRooms"
                          min="0"
                          required
                          value={formData.emptyRooms}
                          onChange={handleChange}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none text-sm font-medium transition-all"
                          placeholder="2"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Link Google Maps Lokasi
                      </label>
                      <input
                        type="url"
                        name="googleMapsLink"
                        value={formData.googleMapsLink}
                        onChange={handleChange}
                        readOnly={!isManualInput}
                        className={`w-full px-3.5 py-2.5 rounded-xl border outline-none text-sm font-medium transition-all ${
                          !isManualInput 
                            ? 'bg-slate-50 text-slate-500 border-slate-200 cursor-not-allowed font-medium' 
                            : 'bg-white text-slate-900 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 border-slate-200'
                        }`}
                        placeholder={!isManualInput ? "Link lokasi tersinkronisasi otomatis dari titik koordinat listing" : "https://maps.app.goo.gl/... atau https://google.com/maps/..."}
                      />
                      {!isManualInput && (
                        <p className="text-[10px] text-slate-400 mt-1 italic">
                          * Titik koordinat peta diambil langsung dari data listing properti Anda.
                        </p>
                      )}
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-xs font-bold text-slate-700">
                          Alamat Lengkap Kost <span className="text-rose-500">*</span>
                        </label>
                        <div className="flex gap-2">
                          {isManualInput && (
                            <button
                              type="button"
                              onClick={() => setShowMapPicker(!showMapPicker)}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border cursor-pointer ${
                                showMapPicker 
                                  ? 'bg-orange-500 text-white border-orange-500 shadow-xs' 
                                  : 'bg-orange-50 hover:bg-orange-100 text-orange-600 border-orange-200'
                              }`}
                            >
                              <Compass size={12} />
                              <span>{showMapPicker ? 'Tutup Peta' : 'Pilih di Peta'}</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={handleGetLocation}
                            disabled={isDetectingLocation}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-600 text-[10px] font-black uppercase tracking-wider transition-all border border-orange-200 disabled:opacity-50 cursor-pointer"
                          >
                            <MapPin size={11} className="stroke-[2.5]" />
                            <span>{isDetectingLocation ? 'Mencari GPS...' : 'Ambil GPS'}</span>
                          </button>
                        </div>
                      </div>

                      {isManualInput && showMapPicker && (
                        <div className="mb-3 space-y-2 animate-in slide-in-from-top-4 duration-300">
                          <span className="block text-[10px] font-black text-orange-600 uppercase tracking-widest leading-none">
                            Geser marker merah atau klik di peta untuk menentukan titik koordinat
                          </span>
                          <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-50 relative z-0">
                            <LocationPicker 
                              lat={mapCoords.lat}
                              lng={mapCoords.lng}
                              onLocationChange={(lat, lng, address) => {
                                setMapCoords({ lat, lng });
                                setFormData(prev => ({
                                  ...prev,
                                  googleMapsLink: `https://www.google.com/maps?q=${lat},${lng}`,
                                  address: address || prev.address
                                }));
                              }}
                            />
                          </div>
                        </div>
                      )}

                      <textarea
                        name="address"
                        required
                        rows={3}
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="Contoh: Jl. Perintis Kemerdekaan KM 9, No. 12, Tamalanrea, Makassar"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none text-sm resize-none font-medium transition-all"
                      />
                    </div>
                  </div>

                  {/* Sticky Footer Tahap 2 */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3 bg-white sticky bottom-0">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => setModalStep('method')}
                      className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs sm:text-sm font-bold transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                    >
                      <ArrowLeft size={14} />
                      <span>Kembali ke Pilihan Metode</span>
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 sm:px-8 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-orange-500/25 transition-all cursor-pointer"
                    >
                      <span>Lanjut: Syarat & Ketentuan</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </form>
              )}

              {/* ========================================================================= */}
              {/* TAHAP 3: SYARAT & KETENTUAN (MoU) & PEMBAYARAN                            */}
              {/* ========================================================================= */}
              {modalStep === 'mou' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  
                  {/* Order & Property Summary Card */}
                  <div className="rounded-2xl border border-orange-200/90 bg-gradient-to-br from-orange-50/70 via-white to-amber-50/50 p-4 sm:p-5 space-y-3 shadow-xs">
                    <div className="flex items-center justify-between border-b border-orange-100 pb-2.5">
                      <span className="text-[11px] font-black text-orange-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles size={13} className="text-orange-500" />
                        Ringkasan Pendaftaran
                      </span>
                      <span className="text-xs font-black text-orange-600 bg-orange-100/70 px-2.5 py-0.5 rounded-full border border-orange-200">
                        {packageLabel} ({packageDuration === 12 ? '1 Tahun' : `${packageDuration} Bulan`})
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="bg-white/90 rounded-xl p-3 border border-orange-100/80 shadow-2xs">
                        <span className="text-[10px] font-bold text-slate-400 block mb-0.5">Properti Kost:</span>
                        <strong className="text-slate-900 block truncate text-sm">{formData.kostName || 'Kost Anda'}</strong>
                        <span className="text-[11px] text-slate-500 font-medium block truncate mt-0.5">
                          Tipe: {formData.kostType} • {formData.totalRooms} Kamar
                        </span>
                      </div>
                      <div className="bg-white/90 rounded-xl p-3 border border-orange-100/80 shadow-2xs">
                        <span className="text-[10px] font-bold text-slate-400 block mb-0.5">Biaya Berlangganan:</span>
                        <strong className="text-orange-600 block text-base font-black">
                          {FORMAT_CURRENCY(packagePrice)}
                        </strong>
                        <span className="text-[10px] text-slate-500 font-medium block">
                          Termasuk survey & foto profesional
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Document Terms Box */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <FileText size={15} className="text-orange-500" />
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">
                        Syarat & Ketentuan Layanan KostManager
                      </h4>
                    </div>

                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 sm:p-5 max-h-56 overflow-y-auto text-xs space-y-3.5 text-slate-600 font-medium leading-relaxed">
                      <div className="flex gap-2.5">
                        <div className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0 text-[10px] font-bold">
                          1
                        </div>
                        <div>
                          <strong className="text-slate-900 block mb-0.5">Biaya Berlangganan & Aktivasi:</strong>
                          Berlangganan KostManager dikenakan tarif resmi {FORMAT_CURRENCY(packagePrice)} per {packageDuration === 12 ? 'tahun' : `${packageDuration} bulan`} per properti kost. Layanan aktif setelah pembayaran terverifikasi.
                        </div>
                      </div>

                      <div className="flex gap-2.5">
                        <div className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0 text-[10px] font-bold">
                          2
                        </div>
                        <div>
                          <strong className="text-slate-900 block mb-0.5">Kunjungan Surveyor & Foto Profesional:</strong>
                          Tim surveyor resmi RuangSinggah.id akan menjadwalkan kunjungan langsung ke lokasi properti untuk pengambilan foto/video berkualitas tinggi dan pembuatan denah/katalog visual kamar.
                        </div>
                      </div>

                      <div className="flex gap-2.5">
                        <div className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0 text-[10px] font-bold">
                          3
                        </div>
                        <div>
                          <strong className="text-slate-900 block mb-0.5">Media Promosi Eksklusif:</strong>
                          Seluruh materi visual akan dipromosikan melalui channel prioritas RuangSinggah.id (Instagram, TikTok, Website, dan Banner Prioritas) untuk mempercepat keterisian kamar.
                        </div>
                      </div>

                      <div className="flex gap-2.5">
                        <div className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0 text-[10px] font-bold">
                          4
                        </div>
                        <div>
                          <strong className="text-slate-900 block mb-0.5">Sistem Penagihan & Pembayaran Terpadu:</strong>
                          Tagihan sewa bulanan penghuni dikelola otomatis oleh sistem digital RuangSinggah.id dan dicairkan berkala langsung ke rekening/dompet pemilik.
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Agreement Checkbox */}
                  <div 
                    onClick={() => setHasAgreedMoU(!hasAgreedMoU)}
                    className={`flex items-start gap-3 p-4 rounded-2xl border transition-all cursor-pointer ${
                      hasAgreedMoU 
                        ? 'bg-orange-50/80 border-orange-500 ring-2 ring-orange-500/20 shadow-xs' 
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="mt-0.5">
                      <input
                        type="checkbox"
                        id="agree-cb-landing"
                        checked={hasAgreedMoU}
                        onChange={(e) => setHasAgreedMoU(e.target.checked)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500 border-slate-300 cursor-pointer bg-white"
                      />
                    </div>
                    <label htmlFor="agree-cb-landing" className="text-xs text-slate-800 font-bold cursor-pointer select-none flex-1 leading-relaxed">
                      Saya menyatakan telah membaca, memahami, dan menyetujui seluruh Ketentuan Berlangganan KostManager serta bersedia menerima kunjungan tim surveyor lokasi.
                    </label>
                  </div>

                  {/* Sticky Footer Tahap 3 */}
                  <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 bg-white sticky bottom-0">
                    <button
                      type="button"
                      onClick={() => setModalStep('form')}
                      className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs sm:text-sm font-bold transition-all cursor-pointer"
                    >
                      Kembali ke Formulir
                    </button>
                    <button
                      type="button"
                      disabled={!hasAgreedMoU}
                      onClick={handleSubmitPayment}
                      className="px-6 sm:px-8 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-orange-500/25 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ShieldCheck size={17} className="stroke-[2.5]" />
                      <span>Setuju & Lanjut Pembayaran</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment Gateway Modal */}
      {showPayment && user && (
        <PaymentGateway
          amount={packagePrice}
          orderId={`KM-${Date.now()}`}
          productId="5ea7b4e9-6f8d-4a11-b845-8c7a726359e2"
          productType="kostmanager"
          userId={user.uid || user.id}
          metadata={paymentMetadata}
          onPaymentSuccess={() => {
            localStorage.removeItem('kostmanager_onboarding_draft');
            setShowPayment(false);
            setIsModalOpen(false);
            setIsSuccess(true);
            setSearchParams({});
            alert('Pembayaran sukses! Langganan KostManager Anda aktif dan penugasan survey telah dibuat otomatis.');
            navigate(`${Page.DASHBOARD_MITRA}/profile/km-progress`);
          }}
          onCancel={() => {
            setShowPayment(false);
            setSearchParams({});
          }}
        />
      )}
    </div>
  );
};

export default KostManagerLanding;
