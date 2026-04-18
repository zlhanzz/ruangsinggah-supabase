import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Kost, RoomType, RoomPricing, PricingPeriod, DatabaseProduct, Page, SurveyRequest, Banner } from '../types';
import { FORMAT_CURRENCY } from '../constants';
import { supabase } from '../supabase';
import {
    getAdminTransactions, updateTransactionStatus, AdminTransaction,
    processBookingApproval,
    deleteTransaction, deleteTransactions,
    getAllDatabases, addDatabaseProduct, updateDatabaseProduct, deleteDatabase,
    getAdminProperties, addPropertyWithMedia, updatePropertyWithMedia,
    updatePropertyStatus, deleteProperty, BasicPropertyInfo,
    getAnalyticsSummary, AnalyticsSummary,
    getAdminSurveyRequests, updateSurveyRequest, deleteSurveyRequest, deleteSurveyRequests, getSurveyAgents, generateManualDriveFolder,
    getAgentVerificationRequests, updateAgentVerificationStatus,
    uploadSurveyPhoto, deleteSurveyPhoto,
    getAdminMitraRequests, updateMitraRequestStatus,
    getAdminBanners, addBanner, updateBanner, deleteBanner,
    getUsersByRole, getActiveMitra, deleteUserAccount, updateUserStatus,
    transferPropertyOwnership, getUserFullDetails
} from '../adminService';
import AgentDashboard from './AgentDashboard';
import { getUserTransactions } from '../userService';
import { sendNotification, notifySurveyStatusUpdate } from '../notificationService';
import { notifyAdminTransaction } from '../emailService';
import Listings from './Listings';
import AnalyticsView from '../components/admin/AnalyticsView';
import AgentManagement from '../components/admin/AgentManagement';
import MitraManagement from '../components/admin/MitraManagement';
import UserManagement from '../components/admin/UserManagement';
import SurveyManagement from '../components/admin/SurveyManagement';
import BannerManagement from '../components/admin/BannerManagement';
import ComplaintManagement from '../components/admin/ComplaintManagement';
import CatalogManagement from '../components/admin/CatalogManagement';
import RentTransactionManagement from '../components/admin/RentTransactionManagement';
import DbTransactionManagement from '../components/admin/DbTransactionManagement';

import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    BarChart, Bar, Legend
} from 'recharts';
import { Zap } from 'lucide-react';



const DUMMY_WITHDRAWAL_DATA = [
    {
        id: 'WD-DUMMY-101',
        amount: 210000,
        date: new Date(Date.now() - 432000000).toISOString(),
        status: 'Selesai',
        bank_name: 'BCA',
        bank_account: '1234567890',
        bank_account_name: 'Agen Survey Dummy'
    },
    {
        id: 'WD-DUMMY-102',
        amount: 140000,
        date: new Date(Date.now() - 864000000).toISOString(),
        status: 'Selesai',
        bank_name: 'BCA',
        bank_account: '1234567890',
        bank_account_name: 'Agen Survey Dummy'
    }
];

interface DashboardProps {
    role: string;
    onPageChange: (p: any) => void;
    listings?: Kost[];
    uid?: string;
    onAdd: (kost: Kost) => void;
    onEdit?: (k: Kost) => void;
    onDelete?: (id: string) => void;
    onRefreshListings?: () => void; // Re-fetch public listings setelah admin save
    verificationStatus?: string;
    user?: any;
}

// Leaflet Type Definition stub
declare global {
    interface Window {
        L: any;
    }
}

// Helper Component for Leaflet Map
// Helper Component for Leaflet Map
const LocationPicker: React.FC<{ lat: number; lng: number; onLocationChange: (lat: number, lng: number, address: string, city?: string, area?: string) => void }> = ({ lat, lng, onLocationChange }) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<any>(null);
    const markerInstance = useRef<any>(null);

    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        if (!mapContainerRef.current) return;
        if (mapInstance.current) return; // Initialize once

        if (typeof window.L === 'undefined') {
            console.error("Leaflet API not loaded");
            return;
        }

        const L = window.L;
        const initialLocation = [lat, lng];

        // Initialize Map
        const map = L.map(mapContainerRef.current).setView(initialLocation, 15);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        // Initialize Marker
        const marker = L.marker(initialLocation, { draggable: true }).addTo(map);

        const updatePositionAndAddress = async (lat: number, lng: number) => {
            // Reverse Geocoding using Nominatim
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`, {
                    headers: {
                        'User-Agent': 'RuangSinggah/1.0'
                    }
                });
                const data = await response.json();
                const addressStr = data.display_name || "Alamat tidak ditemukan";
                const addressObj = data.address || {};
                const city = addressObj.city || addressObj.town || addressObj.municipality || addressObj.county || addressObj.state || '';
                const area = addressObj.suburb || addressObj.village || addressObj.district || addressObj.neighbourhood || '';
                
                onLocationChange(lat, lng, addressStr, city, area);
                setSearchQuery(addressStr);
            } catch (error) {
                console.error("Geocoding failed:", error);
                onLocationChange(lat, lng, "Gagal memuat alamat");
            }
        };

        // Listeners
        marker.on('dragend', function (event: any) {
            const marker = event.target;
            const position = marker.getLatLng();
            updatePositionAndAddress(position.lat, position.lng);
        });

        map.on('click', function (e: any) {
            marker.setLatLng(e.latlng);
            updatePositionAndAddress(e.latlng.lat, e.latlng.lng);
        });

        mapInstance.current = map;
        markerInstance.current = marker;

        // Force map invalidation to ensure tiles load correctly after rendering
        setTimeout(() => {
            map.invalidateSize();
        }, 100);

    }, []);

    // Update marker position if props change from outside
    useEffect(() => {
        if (markerInstance.current && mapInstance.current && window.L) {
            const currentLatLng = markerInstance.current.getLatLng();
            // Check difference to avoid loops
            if (Math.abs(currentLatLng.lat - lat) > 0.0001 || Math.abs(currentLatLng.lng - lng) > 0.0001) {
                const newLatLng = [lat, lng];
                markerInstance.current.setLatLng(newLatLng);
                mapInstance.current.setView(newLatLng, 15);
            }
        }
    }, [lat, lng]);

    // Handlers removed to be handled by Dashboard

    return (
        <div id="map" ref={mapContainerRef} style={{ height: '400px', width: '100%', border: '1px solid #ccc', borderRadius: '0.75rem', zIndex: 0 }} />
    );
};

type DashboardMenu = 'analytics' | 'overview' | 'properties' | 'databases' | 'transactions_rent' | 'transactions_db' | 'mitra' | 'verification' | 'complaints' | 'verifikasi' | 'my_surveys' | 'agent_wallet' | 'tenants' | 'agent_verification' | 'banners';

const Dashboard: React.FC<DashboardProps> = ({ role, uid, user, onPageChange, listings = [], onAdd, onEdit, onDelete, onRefreshListings, verificationStatus }) => {
    const isAdmin = role === 'admin';
    const isAgent = role === 'survey_agent' || role === 'agen';
    const isOwner = role === 'owner' || role === 'mitra';

    const navigate = useNavigate();
    const { "*": tab } = useParams();

    const [activeMenu, setActiveMenu] = useState<DashboardMenu>(
        (tab as DashboardMenu) || (isAgent ? 'overview' : (isOwner ? 'properties' : 'analytics'))
    );

    // Sync state with URL
    useEffect(() => {
        if (tab && tab !== activeMenu) {
            setActiveMenu(tab as DashboardMenu);
        }
    }, [tab]);

    const handleMenuChange = (menu: DashboardMenu) => {
        const basePath = isAdmin ? Page.DASHBOARD_ADMIN : (isAgent ? Page.DASHBOARD_AGENT : Page.DASHBOARD_MITRA);
        navigate(`${basePath}/${menu}`);
    };

    const [agentTab, setAgentTab] = useState<'pending' | 'active' | 'history'>('pending');

    // --- STATE FILTER ANALITIK ---
    const [dateFilter, setDateFilter] = useState<string>('all');
    const [customStartDate, setCustomStartDate] = useState<string>('');
    const [customEndDate, setCustomEndDate] = useState<string>('');
    const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
    const [dashboardViewMode, setDashboardViewMode] = useState<'personal' | 'global'>(isAdmin ? 'global' : 'personal');

    // --- STATE BARU UNTUK KONFIRMASI DELETE ---
    const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string; type: 'kost' | 'database' } | null>(null);
    // --- STATE UNTUK TRANSFER PROPERTI ---
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [transferMode, setTransferMode] = useState<'property' | 'mitra'>('property');
    const [selectedTransferItem, setSelectedTransferItem] = useState<any>(null);
    const [transferSearchQuery, setTransferSearchQuery] = useState('');

    const [selectedUserForDetail, setSelectedUserForDetail] = useState<any>(null);
    const [isUserDetailModalOpen, setIsUserDetailModalOpen] = useState(false);
    const [isLoadingUserDetail, setIsLoadingUserDetail] = useState(false);
    // --- AKHIR STATE UNTUK TRANSFER PROPERTI ---

    // Form State (Property)
    const initialFormState: Partial<Kost> = {
        title: '', description: '', type: 'Campur', status: 'published', price: 0,
        city: '', area: '', address: '',
        location: { lat: -6.2088, lng: 106.8456 }, // Jakarta (Central) as neutral default
        imageUrls: [], videoUrls: [], instagramUrl: '', tiktokUrl: '', facilities: [], rules: [], roomTypes: [],
        additionalFeePrice: 0, additionalFeeName: '', campuses: [], publicFacilities: [],
        omnichannelContactName: '', omnichannelContactPhone: '', omnichannelContactType: 'owner'
    };
    const [formData, setFormData] = useState<Partial<Kost>>(initialFormState);

    // File Upload State (Property)
    const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
    const [newVideoFiles, setNewVideoFiles] = useState<File[]>([]);



    const [tempRuleInput, setTempRuleInput] = useState('');
    const [tempFacilityInput, setTempFacilityInput] = useState('');
    const [tempTagInput, setTempTagInput] = useState<{ [key: string]: string }>({});

    // --- NEW MANAGEMENT STATE ---
    // Minimal states for orchestration
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<string>('info');
    const [mapAddress, setMapAddress] = useState<string>("");

    // DATA STATE
    const [adminListings, setAdminListings] = useState<BasicPropertyInfo[]>([]);


    // --- SEARCH LOCATION STATE ---
    const [searchLocationText, setSearchLocationText] = useState("");
    const [isSearchingLocation, setIsSearchingLocation] = useState(false);
    const [searchLocationResults, setSearchLocationResults] = useState<any[]>([]);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleSearchLocation = (text: string) => {
        setSearchLocationText(text);

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        if (text.length < 3) { // Hanya cari jika teks cukup panjang
            setSearchLocationResults([]);
            setIsSearchingLocation(false);
            return;
        }

        searchTimeoutRef.current = setTimeout(async () => {
            setIsSearchingLocation(true);
            try {
                // Geocoding menggunakan Nominatim (OpenStreetMap)
                const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(text)}&countrycodes=id&limit=5`, {
                    headers: { 'User-Agent': 'RuangSinggah.id/1.0' }
                });
                const data = await response.json();
                setSearchLocationResults(data);
            } catch (error) {
                console.error("Error searching location with Nominatim:", error);
                setSearchLocationResults([]);
            } finally {
                setIsSearchingLocation(false);
            }
        }, 500); // Debounce selama 500ms
    };

    const handleSelectSearchResult = (result: any) => {
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        const address = result.display_name;

        // Perbarui formData untuk menggerakkan peta
        setFormData(prev => ({ ...prev, location: { lat, lng } }));
        setMapAddress(address); // Perbarui input alamat di form

        setSearchLocationText(address); // Set input pencarian dengan alamat lengkap
        setSearchLocationResults([]); // Kosongkan hasil pencarian
    };
    const loadAnalyticsData = async () => {
        if (!isAdmin) return;
        setLoading(true);
        try {
            const data = await getAnalyticsSummary(
                dateFilter, 
                customStartDate, 
                customEndDate, 
                dashboardViewMode === 'personal' ? uid : undefined
            );
            setAnalyticsSummary(data);
        } catch (error) {
            console.error("Gagal memuat data analitik", error);
        } finally {
            setLoading(false);
        }
    };

    const [dbProducts, setDbProducts] = useState<DatabaseProduct[]>([]);
    
    // --- SURVEY CATALOG STATE ---
    const [verifikasiPrice, setVerifikasiPrice] = useState(70000);
    const [verifikasiDiscount, setVerifikasiDiscount] = useState(150000);
    const [verifikasiDescription, setVerifikasiDescription] = useState("Dapatkan bantuan profesional untuk mengecek kondisi kost impian Anda secara langsung via Video Call. Hemat waktu, tenaga, dan hindari penipuan ZONK!");
    const [isSavingVerifikasi, setIsSavingVerifikasi] = useState(false);

    const [analyticsSummary, setAnalyticsSummary] = useState<AnalyticsSummary | null>(null);
    const [mitraRequests, setMitraRequests] = useState<any[]>([]);
    const [activeMitra, setActiveMitra] = useState<any[]>([]);
    const [agentVerifications, setAgentVerifications] = useState<any[]>([]);
    const [surveyRequests, setSurveyRequests] = useState<SurveyRequest[]>([]);
    const [surveyAgents, setSurveyAgents] = useState<{id: string, name: string, phone: string, photo_url?: string, rating?: string}[]>([]);
    const [activeUsers, setActiveUsers] = useState<any[]>([]);
    const [banners, setBanners] = useState<Banner[]>([]);
    const [dbTransactions, setDbTransactions] = useState<AdminTransaction[]>([]);
    const [rentTransactions, setRentTransactions] = useState<any[]>([]);
    const [complaints, setComplaints] = useState<any[]>([]);

    // Selection states
    const [selectedRentTrxIds, setSelectedRentTrxIds] = useState<string[]>([]);
    const [selectedDbTrxIds, setSelectedDbTrxIds] = useState<string[]>([]);
    const [selectedSurveyIds, setSelectedSurveyIds] = useState<string[]>([]);


    const sections = [
        { id: 'info', label: 'Informasi Dasar' },
        { id: 'location', label: 'Lokasi' },
        { id: 'media', label: 'Media (Foto & Video)' },
        { id: 'facilities', label: 'Fasilitas' },
        { id: 'rooms', label: 'Tipe Kamar & Harga' },
        { id: 'rules', label: 'Peraturan' }
    ];

    const loadProperties = async () => {
        if (!isAdmin) return;
        setLoading(true);
        try {
            const data = await getAdminProperties(dashboardViewMode === 'personal' ? uid : undefined);
            setAdminListings(data);
        } catch (error) {
            console.error("Gagal memuat properti:", error);
        } finally {
            setLoading(false);
        }
    };

    const loadDatabases = async () => {
        if (!isAdmin) return;
        setLoading(true);
        try {
            const data = await getAllDatabases();
            setDbProducts(data);
        } catch (e) {
            console.error("Error loading databases", e);
        } finally {
            setLoading(false);
        }
    };



    const loadComplaints = async () => {
        if (!isAdmin) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('complaints')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setComplaints(data || []);
        } finally {
            setLoading(false);
        }
    };



    const loadAgentVerifications = async () => {
        if (!isAdmin) return;
        setLoading(true);
        try {
            const data = await getAgentVerificationRequests();
            setAgentVerifications(data);
        } catch (error) {
            console.error("Gagal memuat verifikasi agen", error);
        } finally {
            setLoading(false);
        }
    };



    // --- AGENT WALLET PROFILE STATE ---
    const [agentBankName, setAgentBankName] = useState('BCA');
    const [agentBankAccount, setAgentBankAccount] = useState('');
    const [agentBankAccountName, setAgentBankAccountName] = useState('');
    const [agentWithdrawalHistory, setAgentWithdrawalHistory] = useState<any[]>([]);
    const [isSavingWalletProfile, setIsSavingWalletProfile] = useState(false);
    const [walletView, setWalletView] = useState<'profile' | 'history'>('profile');
    const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);

    const loadAgentWalletProfile = async () => {
        if (!isAgent) return;
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const metadata = session?.user?.user_metadata || {};
            if (metadata.bank_name) setAgentBankName(metadata.bank_name);
            if (metadata.bank_account) setAgentBankAccount(metadata.bank_account);
            if (metadata.bank_account_name) setAgentBankAccountName(metadata.bank_account_name);
            if (metadata.withdrawal_history) {
                const history = Array.isArray(metadata.withdrawal_history) ? metadata.withdrawal_history : JSON.parse(metadata.withdrawal_history || '[]')
                setAgentWithdrawalHistory(history.length > 0 ? history : (role === 'survey_agent' ? DUMMY_WITHDRAWAL_DATA : []));
            } else {
                setAgentWithdrawalHistory(role === 'survey_agent' ? DUMMY_WITHDRAWAL_DATA : []);
            }
        } catch (error) {
            console.error('Failed to load wallet profile', error);
        }
    };

    const saveAgentWalletProfile = async () => {
        if (!agentBankAccount || !agentBankAccountName) return alert('Mohon lengkapi data rekening.');
        setIsSavingWalletProfile(true);
        try {
            const { error } = await supabase.auth.updateUser({
                data: {
                    bank_name: agentBankName,
                    bank_account: agentBankAccount,
                    bank_account_name: agentBankAccountName
                }
            });
            if (error) throw error;
            alert('Profil penarikan berhasil disimpan!');
        } catch (error) {
            alert('Gagal menyimpan profil penarikan.');
        } finally {
            setIsSavingWalletProfile(false);
        }
    };

    const handleWithdraw = async (totalEarnings: number) => {
        const totalWithdrawn = agentWithdrawalHistory.filter(w => w.status !== 'Ditolak').reduce((sum, item) => sum + (item.amount || 0), 0);
        const netEarnings = totalEarnings - totalWithdrawn;

        if (netEarnings < 50000) return alert('Saldo yang dapat ditarik minimal Rp 50.000');
        if (!agentBankAccount || !agentBankAccountName) return alert('Silakan simpan profil rekening Anda terlebih dahulu.');
        
        setIsSavingWalletProfile(true);
        try {
            const newWithdrawal = {
                id: 'WD-' + Date.now(),
                amount: netEarnings,
                date: new Date().toISOString(),
                status: 'Menunggu',
                bank_name: agentBankName,
                bank_account: agentBankAccount,
                bank_account_name: agentBankAccountName
            };
            
            const newHistory = [newWithdrawal, ...agentWithdrawalHistory];
            // Update auth metadata
            const { error } = await supabase.auth.updateUser({
                data: { withdrawal_history: newHistory }
            });
            if (error) throw error;
            
            setAgentWithdrawalHistory(newHistory);
            
            // Redirect to whatsapp
            const waText = `Halo Admin, saya agen survey ingin mengajukan pencairan dana sebesar ${FORMAT_CURRENCY(netEarnings)} dari akun saya.\n\nDetail Rekening:\nBank: ${agentBankName}\nNo Rekening: ${agentBankAccount}\nAtas Nama: ${agentBankAccountName}`;
            window.open(`https://wa.me/6281234567890?text=${encodeURIComponent(waText)}`, '_blank');
        } catch(error) {
            alert('Gagal mengajukan penarikan');
        } finally {
            setIsSavingWalletProfile(false);
        }
    };

    const loadSurveyRequests = async (silent: boolean = false) => {
        if (!silent) setLoading(true);
        try {
            const realData = await getAdminSurveyRequests() || [];
            
            // IF real data exists, only show real data to avoid confusion
            // We no longer show dummy data even if empty
            setSurveyRequests(realData);
            setSelectedSurveyIds([]); // Reset selection on load

            if (isAdmin) {
                const agents = await getSurveyAgents();
                // Calculate ratings for each agent from realData being displayed
                const agentsWithRatings = agents.map(agent => {
                    const agentSurveys = realData.filter(r => r.assigned_agent_id === agent.id);
                    const ratings = agentSurveys.map(r => r.user_rating || 0).filter(r => r > 0);
                    const avgRating = ratings.length > 0 
                        ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) 
                        : '0.0';
                    return { ...agent, rating: avgRating };
                });
                setSurveyAgents(agentsWithRatings);
            }
        } catch (error) {
            console.error("Gagal memuat survey requests", error);
            // Nonaktifkan fallback ke dummy data
            setSurveyRequests([]);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    // REMOVED: handleUpdateSurvey, handleDeleteSurvey, handleRequestReschedule (Localized to SurveyManagement)



    const loadBanners = async () => {
        if (!isAdmin) return;
        setLoading(true);
        try {
            const data = await getAdminBanners();
            setBanners(data);
        } catch (error) {
            console.error("Gagal memuat banner:", error);
        } finally {
            setLoading(false);
        }
    };


    // REMOVED: handleDeleteBanner (Localized to BannerManagement)
    // REMOVED: handleUpdateComplaintStatus (Localized to ComplaintManagement)

    const loadDbTransactions = async () => {
        setLoading(true);
        try {
            const data = await getAdminTransactions();
            const dbTrx = data.filter(t => t.product_type === 'database');
            setDbTransactions(dbTrx);
        } catch (error) {
            console.error("Gagal memuat transaksi database", error);
        } finally {
            setLoading(false);
            setSelectedDbTrxIds([]);
        }
    };

    const handleDeleteTransaction = async (id: string) => {
        if (!window.confirm('Apakah Anda yakin ingin menghapus riwayat transaksi ini? Data yang dihapus tidak dapat dikembalikan.')) return;
        
        setLoading(true);
        try {
            await deleteTransaction(id);
            alert('Transaksi berhasil dihapus');
            loadDbTransactions();
        } catch (error: any) {
            alert('Gagal menghapus transaksi: ' + (error.message || 'Terjadi kesalahan'));
        } finally {
            setLoading(false);
        }
    };

    // REMOVED: Bulk deletion handlers (Localized to respective components)

    useEffect(() => {
        if (activeMenu === 'properties') loadProperties();
        if (activeMenu === 'databases') loadDatabases();
        if (activeMenu === 'complaints') loadComplaints();
        if (activeMenu === 'transactions_db') loadDbTransactions();
        if (activeMenu === 'analytics' || activeMenu === 'overview') loadAnalyticsData();
        if (activeMenu === 'verifikasi' || activeMenu === 'my_surveys' || activeMenu === 'overview') loadSurveyRequests();
        if (activeMenu === 'agent_wallet') {
            loadSurveyRequests();
            loadAgentWalletProfile();
        }
        if (activeMenu === 'banners') loadBanners();
        if (activeMenu === 'tenants') loadActiveUsers();
        if (activeMenu === 'mitra') {
            loadMitraRequests(); // Pendaftar
            loadActiveMitra();   // Mitra Aktif
        }
        if (activeMenu === 'agent_verification') {
            loadAgentVerifications(); // Requests
            loadActiveAgents();      // Active Agents
        }
    }, [isAdmin, activeMenu, dateFilter, customStartDate, customEndDate, dashboardViewMode]);

    const loadActiveUsers = async () => {
        if (!isAdmin) return;
        setLoading(true);
        try {
            const data = await getUsersByRole('user');
            setActiveUsers(data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const loadActiveMitra = async () => {
        if (!isAdmin) return;
        setLoading(true);
        try {
            const data = await getActiveMitra();
            setActiveMitra(data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const loadActiveAgents = async () => {
        if (!isAdmin) return;
        setLoading(true);
        try {
            const data = await getUsersByRole('survey_agent');
            // Re-use surveyAgents state or separate? Let's keep separate for clarity in management
            setSurveyAgents(data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleDeleteUser = async (uId: string, name: string) => {
        if (!window.confirm(`Hapus akun "${name}" secara permanen? Tindakan ini tidak dapat dibatalkan.`)) return;
        setLoading(true);
        try {
            await deleteUserAccount(uId);
            alert('User berhasil dihapus');
            loadActiveUsers();
            loadActiveMitra();
            loadActiveAgents();
        } catch (e) { alert('Gagal menghapus user'); }
        finally { setLoading(false); }
    };

    const handleBlockUser = async (uId: string, name: string, currentlyBlocked: boolean) => {
        const action = currentlyBlocked ? 'membuka blokir' : 'memblokir';
        if (!window.confirm(`Yakin ingin ${action} akun "${name}"?`)) return;

        setLoading(true);
        try {
            const newStatus = currentlyBlocked ? 'active' : 'blocked';
            await updateUserStatus(uId, newStatus);
            alert(`Berhasil ${action} user.`);
            loadActiveUsers();
            loadActiveMitra();
            loadActiveAgents();
        } catch (e) { alert(`Gagal ${action} user`); }
        finally { setLoading(false); }
    };

    const handleViewProfile = async (userId: string) => {
        setIsLoadingUserDetail(true);
        setIsUserDetailModalOpen(true);
        try {
            const details = await getUserFullDetails(userId);
            setSelectedUserForDetail(details);
        } catch (e) {
            alert('Gagal mengambil detail user');
            setIsUserDetailModalOpen(false);
        } finally {
            setIsLoadingUserDetail(false);
        }
    };

    // --- TRANSFER PROPERTY HANDLERS ---
    const handleOpenTransferModal = (mode: 'property' | 'mitra', item: any) => {
        setTransferMode(mode);
        setSelectedTransferItem(item);
        setTransferSearchQuery('');
        setIsTransferModalOpen(true);
        
        // Load mitras if they are not loaded yet and we are in property transfer mode
        if (mode === 'property' && activeMitra.length === 0) {
            loadActiveMitra();
        }
    };

    const handleConfirmTransfer = async (propertyId: string, newOwnerId: string) => {
        if (!window.confirm("Apakah Anda yakin ingin memindahkan kepemilikan properti ini? Kepemilikan akan berubah sepenuhnya.")) return;
        
        setLoading(true);
        try {
            await transferPropertyOwnership(propertyId, newOwnerId);
            alert("Properti berhasil dipindahkan ke pemilik baru!");
            setIsTransferModalOpen(false);
            
            // Refresh data
            loadProperties();
            loadActiveMitra();
        } catch (error: any) {
            alert(error.message || "Gagal memindahkan properti.");
        } finally {
            setLoading(false);
        }
    };

    // --- PROPERTY HANDLERS ---

    const displayListings = isAdmin ? adminListings : listings.filter(k => k.ownerUid === uid || k.ownerUid === 'owner_1');

    const handleStatusToggle = async (id: string, currentStatus: string) => {
        try {
            const newStatus = currentStatus === 'draft' ? 'published' : 'draft';
            await updatePropertyStatus(id, newStatus);
            setAdminListings(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
        } catch (e) { alert("Gagal mengubah status publikasi."); }
    };

    const handleDelete = async (id: string, type: 'kost' | 'database', name: string) => {
        setItemToDelete({ id, name, type });
        setShowConfirmDeleteModal(true);
    };

    const confirmDeleteItem = async () => {
        if (!itemToDelete) return;

        const { id, type, name } = itemToDelete;
        const label = type === 'kost' ? 'properti' : 'database';

        // Close modal immediately and show loading state if needed, or keep modal open with loading state
        setShowConfirmDeleteModal(false);
        setIsSubmitting(true);

        try {
            if (type === 'kost') {
                await deleteProperty(id);
                loadProperties();
            } else {
                await deleteDatabase(id);
                loadDatabases();
            }
            alert(`${label.charAt(0).toUpperCase() + label.slice(1)} "${name}" berhasil dihapus!`);
            if (onDelete) onDelete(id);
        } catch (e: any) {
            alert(`Gagal menghapus ${label} "${name}": ` + (e.message || "Terjadi kesalahan"));
            console.error(`Error deleting ${type}:`, e);
        } finally {
            setIsSubmitting(false);
            setItemToDelete(null);
        }
    };

    const cancelDeleteItem = () => {
        setShowConfirmDeleteModal(false);
        setItemToDelete(null);
    };

    const handleDeleteFromModal = async () => {
        if (!editingId) return;
        // Reuse the unified delete handler logic or keep specific if needed. 
        // Since this is specific to Property Modal, we can call deleteProperty directly or use handleDelete('kost')
        // But handleDelete expects id.

        if (!window.confirm("Apakah Anda yakin ingin menghapus properti ini secara permanen? Data yang dihapus tidak dapat dikembalikan.")) return;
        setIsSubmitting(true);
        try {
            await deleteProperty(editingId);
            alert('Properti berhasil dihapus!');
            setIsModalOpen(false);
            loadProperties();
            if (onDelete) onDelete(editingId);
        } catch (e: any) {
            alert('Gagal menghapus properti: ' + (e.message || "Terjadi kesalahan"));
        } finally {
            setIsSubmitting(false);
        }
    };

    const openAddModal = () => {
        setEditingId(null);
        setFormData(initialFormState);
        setNewImageFiles([]);
        setNewVideoFiles([]);
        setMapAddress("");
        setSearchLocationText(""); // Reset search text
        setSearchLocationResults([]); // Clear search results
        setActiveTab('info');
        setIsModalOpen(true);
    };

    const openEditModal = (kost: any) => {
        setEditingId(kost.id);
        setFormData(kost);
        setNewImageFiles([]);
        setNewVideoFiles([]);
        setMapAddress(kost.address || ""); // Pre-fill address
        setSearchLocationText(""); // Reset search text on edit
        setSearchLocationResults([]); // Clear search results
        setActiveTab('info');
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Auto calculate minimum price based on Monthly price or lowest available
        let finalPrice = formData.price || 0;
        if (formData.roomTypes && formData.roomTypes.length > 0) {
            // Try to find monthly price first, otherwise fallback to base price logic
            const monthlyPrices = formData.roomTypes
                .map(r => r.pricing?.find(p => p.period === 'bulanan')?.price || r.price)
                .filter(p => p > 0);

            if (monthlyPrices.length > 0) {
                finalPrice = Math.min(...monthlyPrices);
            } else {
                // Fallback to any lowest price
                const allPrices = formData.roomTypes.flatMap(r => r.pricing?.map(p => p.price) || [r.price]);
                finalPrice = Math.min(...allPrices);
            }
        }

        // Use the auto-detected address if available, otherwise manual
        const finalAddress = mapAddress || formData.address;

        const commonData = { ...formData, price: finalPrice, address: finalAddress };

        try {
            if (editingId) {
                await updatePropertyWithMedia(editingId, commonData, newImageFiles, newVideoFiles);
            } else {
                await addPropertyWithMedia({ ...commonData, isVerified: true }, newImageFiles, newVideoFiles);
            }
            await loadProperties();
            if (onRefreshListings) onRefreshListings(); // Refresh public listings di App.tsx
            setIsModalOpen(false);
        } catch (error: any) {
            console.error("Error saving property:", error);
            alert("Gagal menyimpan properti: " + (error.message || "Buka console untuk detailnya"));
        } finally { setIsSubmitting(false); }
    };

    // --- DATABASE HANDLERS ---

    const openAddDbModal = () => {
        setEditingDbId(null);
        setDbForm(initialDbForm);
        setDbCoverFile(null);
        setDbDocFile(null);
        setIsDbModalOpen(true);
    };

    // Generic Helpers
    const addArrayItem = (field: keyof Kost, defaultValue: string = '') => {
        setFormData({ ...formData, [field]: [...(formData[field] as string[] || []), defaultValue] });
    };
    const removeArrayItem = (field: keyof Kost, index: number) => {
        const arr = [...(formData[field] as string[] || [])];
        arr.splice(index, 1); setFormData({ ...formData, [field]: arr });
    };

    // Object Array Helpers (for campuses, publicFacilities)
    const addObjectArrayItem = (field: 'campuses' | 'publicFacilities') => {
        setFormData({ ...formData, [field]: [...(formData[field] || []), { name: '', distance: '', transportMode: 'walk' }] });
    };
    const updateObjectArrayItem = (field: 'campuses' | 'publicFacilities', index: number, key: keyof typeof formData[typeof field][0], value: any) => {
        const arr = [...(formData[field] || [])];
        const item = { ...arr[index], [key]: value };
        arr[index] = item;
        setFormData({ ...formData, [field]: arr });
    };
    const removeObjectArrayItem = (field: 'campuses' | 'publicFacilities', index: number) => {
        const arr = [...(formData[field] || [])];
        arr.splice(index, 1);
        setFormData({ ...formData, [field]: arr });
    };

    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371; // Radius of the Earth in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const d = R * c;
        return parseFloat(d.toFixed(1));
    };

    const [isSearchingFacilityMap, setIsSearchingFacilityMap] = useState<Record<string, boolean>>({});

    const searchFacilityCoordinates = async (field: 'campuses' | 'publicFacilities', index: number, name: string) => {
        if (!name) return;
        const stateKey = `${field}-${index}`;
        setIsSearchingFacilityMap(prev => ({ ...prev, [stateKey]: true }));
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(name)}&countrycodes=id&limit=1`, {
                headers: { 'User-Agent': 'RuangSinggah.id/1.0' }
            });
            const data = await response.json();
            if (data && data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lng = parseFloat(data[0].lon);
                const arr = [...(formData[field] || [])];
                
                let distString = arr[index].distance;
                if (formData.location && formData.location.lat) {
                    const km = calculateDistance(formData.location.lat, formData.location.lng, lat, lng);
                    distString = `± ${km} KM`;
                }

                arr[index] = { ...arr[index], lat, lng, distance: distString };
                setFormData({ ...formData, [field]: arr });
            } else {
                alert('Lokasi tidak ditemukan di peta. Coba setel nama yang lebih spesifik.');
            }
        } catch (error) {
            console.error('Error fetching facility location:', error);
            alert('Gagal mencari kordinat.');
        } finally {
            setIsSearchingFacilityMap(prev => ({ ...prev, [stateKey]: false }));
        }
    };

    const [activeMapPicker, setActiveMapPicker] = useState<{ field: 'campuses' | 'publicFacilities', index: number } | null>(null);

    const handleMapPickerSave = (lat: number, lng: number) => {
        if (!activeMapPicker) return;
        const { field, index } = activeMapPicker;
        const arr = [...(formData[field] || [])];
        
        let distString = arr[index].distance;
        if (formData.location && formData.location.lat) {
            const km = calculateDistance(formData.location.lat, formData.location.lng, lat, lng);
            distString = `± ${km} KM`;
        }

        arr[index] = { ...arr[index], lat, lng, distance: distString };
        setFormData({ ...formData, [field]: arr });
        setActiveMapPicker(null);
    };

    // File Helpers
    const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setNewImageFiles(prev => [...prev, ...Array.from(e.target.files!)]);
        }
    };
    const removeNewImage = (index: number) => {
        setNewImageFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleVideoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setNewVideoFiles(prev => [...prev, ...Array.from(e.target.files!)]);
        }
    };

    // --- MEDIA DRAG & DROP REORDER ---
    const handleMediaDragStart = (e: React.DragEvent, index: number, type: 'existing' | 'new') => {
        e.dataTransfer.setData('index', index.toString());
        e.dataTransfer.setData('type', type);
        // Visual feedback
        if (e.currentTarget instanceof HTMLElement) {
            e.currentTarget.style.opacity = '0.5';
        }
    };

    const handleMediaDragEnd = (e: React.DragEvent) => {
        if (e.currentTarget instanceof HTMLElement) {
            e.currentTarget.style.opacity = '1';
        }
    };

    const handleMediaDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleMediaDrop = (e: React.DragEvent, dropIndex: number, dropType: 'existing' | 'new') => {
        e.preventDefault();
        const dragIndex = parseInt(e.dataTransfer.getData('index'));
        const dragType = e.dataTransfer.getData('type');

        if (dragType !== dropType) return; // Prevent mixing for now to keep logic simple
        if (dragIndex === dropIndex) return;

        if (dragType === 'existing') {
            const items = [...(formData.imageUrls || [])];
            const [movedItem] = items.splice(dragIndex, 1);
            items.splice(dropIndex, 0, movedItem);
            setFormData({ ...formData, imageUrls: items });
        } else {
            const items = [...newImageFiles];
            const [movedItem] = items.splice(dragIndex, 1);
            items.splice(dropIndex, 0, movedItem);
            setNewImageFiles(items);
        }
    };
    const removeNewVideo = (index: number) => {
        setNewVideoFiles(prev => prev.filter((_, i) => i !== index));
    };

    const removeExistingMedia = (type: 'imageUrls' | 'videoUrls', urlToRemove: string) => {
        const currentList = formData[type] || [];
        const newList = currentList.filter(url => url !== urlToRemove);
        setFormData({ ...formData, [type]: newList });
    };

    // Room Helpers
    const addRoomType = () => {
        const newRoom: RoomType = { 
            name: 'New Room', size: '', price: 0, 
            pricing: [{ period: 'bulanan', price: 0 }], 
            features: [], roomFacilities: [], bathroomFacilities: [], isAvailable: true,
            availableRoomCount: 1,
            maxOccupants: 1, additionalCostPerPerson: 0 
        };
        setFormData({ ...formData, roomTypes: [...(formData.roomTypes || []), newRoom] });
    };
    const updateRoomType = (index: number, field: keyof RoomType, value: any) => {
        const rooms = [...(formData.roomTypes || [])];
        let newVal = value;

        // Correlation Logic
        if (field === 'availableRoomCount') {
            const count = parseInt(value) || 0;
            rooms[index].isAvailable = count > 0;
            newVal = count;
        } else if (field === 'isAvailable') {
            if (value === true && (rooms[index].availableRoomCount || 0) <= 0) {
                rooms[index].availableRoomCount = 1;
            } else if (value === false) {
                rooms[index].availableRoomCount = 0;
            }
        }

        rooms[index] = { ...rooms[index], [field]: newVal };
        setFormData({ ...formData, roomTypes: rooms });
    };

    const updateRoomPricing = (roomIndex: number, pricingIndex: number, field: keyof RoomPricing, value: any) => {
        const rooms = [...(formData.roomTypes || [])];
        const pricing = [...(rooms[roomIndex].pricing || [])];
        pricing[pricingIndex] = { ...pricing[pricingIndex], [field]: value };
        rooms[roomIndex].pricing = pricing;

        // Sync legacy price field if monthly
        if (pricing[pricingIndex].period === 'bulanan' && field === 'price') {
            rooms[roomIndex].price = Number(value);
        }

        setFormData({ ...formData, roomTypes: rooms });
    };

    const addRoomPricing = (roomIndex: number) => {
        const rooms = [...(formData.roomTypes || [])];
        const pricing = [...(rooms[roomIndex].pricing || [])];
        pricing.push({ period: '3bulanan', price: 0 });
        rooms[roomIndex].pricing = pricing;
        setFormData({ ...formData, roomTypes: rooms });
    };

    const removeRoomPricing = (roomIndex: number, pricingIndex: number) => {
        const rooms = [...(formData.roomTypes || [])];
        const pricing = [...(rooms[roomIndex].pricing || [])];
        pricing.splice(pricingIndex, 1);
        rooms[roomIndex].pricing = pricing;
        setFormData({ ...formData, roomTypes: rooms });
    };

    const removeRoomType = (index: number) => {
        const rooms = [...(formData.roomTypes || [])];
        rooms.splice(index, 1);
        setFormData({ ...formData, roomTypes: rooms });
    };

    const addRoomTag = (roomIndex: number, field: 'features' | 'roomFacilities' | 'bathroomFacilities', tag: string) => {
        if (!tag.trim()) return;
        const rooms = [...(formData.roomTypes || [])];
        const currentTags = rooms[roomIndex][field] || [];
        rooms[roomIndex][field] = [...currentTags, tag];
        setFormData({ ...formData, roomTypes: rooms });
        setTempTagInput({ ...tempTagInput, [`${roomIndex}-${field}`]: '' });
    };

    const removeRoomTag = (roomIndex: number, field: 'features' | 'roomFacilities' | 'bathroomFacilities', tagIndex: number) => {
        const rooms = [...(formData.roomTypes || [])];
        const currentTags = rooms[roomIndex][field] || [];
        currentTags.splice(tagIndex, 1);
        rooms[roomIndex][field] = currentTags;
        setFormData({ ...formData, roomTypes: rooms });
    };

    // --- Render Content Helper ---
    const renderSectionContent = (sectionId: string) => {
        switch (sectionId) {
            case 'info':
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nama Kost</label>
                                <input required type="text" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-orange-500" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Contoh: Kost Orange Dramaga" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tipe Kost</label>
                                <select className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-orange-500" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value as any })}>
                                    <option value="Putra">Putra</option>
                                    <option value="Putri">Putri</option>
                                    <option value="Campur">Campur</option>
                                </select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Deskripsi Lengkap</label>
                            <textarea rows={6} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-orange-500" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Jelaskan keunggulan kost..." />
                        </div>

                         {/* Omnichannel Contact Section */}
                         <div className="bg-orange-50/50 p-6 rounded-2xl border border-orange-100 space-y-4">
                            <h4 className="text-[10px] font-black text-orange-600 uppercase tracking-widest flex items-center gap-2 text-sm">
                                <Zap className="w-3 h-3" /> Omnichannel Contact (WhatsApp Forwarding)
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nama Kontak</label>
                                    <input type="text" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-orange-500" value={formData.omnichannelContactName || ''} onChange={e => setFormData({ ...formData, omnichannelContactName: e.target.value })} placeholder="Nama Pemilik/Penjaga" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">WhatsApp (628...)</label>
                                    <input type="text" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-orange-500" value={formData.omnichannelContactPhone || ''} onChange={e => setFormData({ ...formData, omnichannelContactPhone: e.target.value })} placeholder="628123456789" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pihak Bertanggung Jawab</label>
                                <div className="flex gap-6 mt-1">
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <input type="radio" name="contactType" value="owner" checked={formData.omnichannelContactType === 'owner' || !formData.omnichannelContactType} onChange={() => setFormData({ ...formData, omnichannelContactType: 'owner' })} className="w-4 h-4 text-orange-500 focus:ring-orange-500 border-gray-300" />
                                        <span className="text-xs font-bold text-gray-700 group-hover:text-orange-600 transition-colors uppercase tracking-widest">Pemilik Kost</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <input type="radio" name="contactType" value="caretaker" checked={formData.omnichannelContactType === 'caretaker'} onChange={() => setFormData({ ...formData, omnichannelContactType: 'caretaker' })} className="w-4 h-4 text-orange-500 focus:ring-orange-500 border-gray-300" />
                                        <span className="text-xs font-bold text-gray-700 group-hover:text-orange-600 transition-colors uppercase tracking-widest">Penjaga Kost</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'location':
                return (
                    <div className="space-y-6">
                        {/* --- INPUT PENCARIAN LOKASI BARU --- */}
                        <div className="space-y-2 relative z-[1000]">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Cari Lokasi (Nama Jalan/Kota)</label>
                            <input
                                type="text"
                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-orange-500"
                                placeholder="Contoh: Jl. Sudirman, Jakarta..."
                                value={searchLocationText}
                                onChange={(e) => handleSearchLocation(e.target.value)}
                            />
                            {isSearchingLocation && <p className="text-xs text-gray-500 mt-1">Mencari...</p>}
                            {searchLocationResults.length > 0 && (
                                <ul className="absolute left-0 right-0 top-full bg-white border border-gray-200 rounded-xl mt-2 max-h-48 overflow-y-auto shadow-lg z-[1001]">
                                    {searchLocationResults.map((result, index) => (
                                        <li
                                            key={index}
                                            className="px-4 py-2 text-sm text-gray-800 cursor-pointer hover:bg-orange-50 border-b border-gray-50 last:border-b-0"
                                            onClick={() => handleSelectSearchResult(result)}
                                        >
                                            {result.display_name}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        {/* --- AKHIR INPUT PENCARIAN LOKASI BARU --- */}

                        <div className="space-y-4">
                            <h3 className="font-bold text-gray-900">Lokasi Kost (dengan Peta)</h3>
                            <div className="rounded-xl overflow-hidden border border-gray-200">
                                <LocationPicker
                                    lat={formData.location?.lat ?? -6.2088}
                                    lng={formData.location?.lng ?? 106.8456}
                                    onLocationChange={(lat, lng, address, city, area) => {
                                        setFormData(prev => {
                                            const updates: Partial<Kost> = { location: { lat, lng } };
                                            if (city) updates.city = city.replace('Kota ', '').replace('Kabupaten ', '');
                                            if (area) updates.area = area.replace('Kecamatan ', '');
                                            return { ...prev, ...updates };
                                        });
                                        setMapAddress(address);
                                    }}
                                />
                            </div>
                            <p className="text-xs text-gray-500 italic">Klik di peta untuk menentukan lokasi, atau seret penanda.</p>
                        </div>

                        {/* Inputs requested by user */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label htmlFor="addressInput" className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Alamat Terpilih:</label>
                                <input
                                    type="text"
                                    id="addressInput"
                                    readOnly
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium outline-none text-gray-600"
                                    value={mapAddress}
                                    placeholder="Alamat akan muncul di sini"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label htmlFor="lokasiLat" className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Latitude:</label>
                                    <input
                                        type="number"
                                        id="lokasiLat"
                                        step="any"
                                        readOnly
                                        required
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none cursor-not-allowed text-gray-500"
                                        value={formData.location?.lat}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="lokasiLng" className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Longitude:</label>
                                    <input
                                        type="number"
                                        id="lokasiLng"
                                        step="any"
                                        readOnly
                                        required
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none cursor-not-allowed text-gray-500"
                                        value={formData.location?.lng}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-100 pt-6"></div>

                        {/* Additional fields needed for the app */}
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Kota</label>
                                <input type="text" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-orange-500" value={formData.city || ''} onChange={e => setFormData({ ...formData, city: e.target.value })} placeholder="Bojonegoro/Bogor..." />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Area (Kecamatan/Daerah)</label>
                                <input type="text" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-orange-500" value={formData.area || ''} onChange={e => setFormData({ ...formData, area: e.target.value })} placeholder="Dramaga/Dago..." />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Detail Alamat (Nomor Rumah/RT/RW)</label>
                            <textarea rows={2} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-orange-500" value={formData.address || ''} onChange={e => setFormData({ ...formData, address: e.target.value })} placeholder="Detail manual..." />
                        </div>

                        {/* KAMPUS TERDEKAT (ARRAY) */}
                        <div className="space-y-4 pt-4 border-t border-gray-100">
                            <h3 className="font-bold text-gray-900 border-l-4 border-orange-500 pl-3">Kampus Terdekat</h3>
                            <div className="space-y-3">
                                {formData.campuses?.map((campus, idx) => (
                                    <div key={idx} className="flex flex-col gap-3 items-start bg-orange-50 p-4 rounded-xl border border-orange-100">
                                        <div className="flex flex-col sm:flex-row gap-4 w-full items-start sm:items-center">
                                            <div className="flex-1 flex gap-2 w-full">
                                                <input
                                                    type="text"
                                                    value={campus.name}
                                                    onChange={(e) => updateObjectArrayItem('campuses', idx, 'name', e.target.value)}
                                                    className="w-full bg-white border border-orange-200 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:border-orange-500"
                                                    placeholder="Nama Kampus (Misal: IPB Dramaga)"
                                                />
                                                <button 
                                                    type="button" 
                                                    onClick={() => searchFacilityCoordinates('campuses', idx, campus.name)}
                                                    disabled={isSearchingFacilityMap[`campuses-${idx}`]}
                                                    className="bg-orange-500 text-white px-3 py-2 rounded-lg text-xs font-bold shrink-0 hover:bg-orange-600 disabled:opacity-50"
                                                >
                                                    {isSearchingFacilityMap[`campuses-${idx}`] ? 'Mencari...' : 'Cari Koordinat'}
                                                </button>
                                                <button 
                                                    type="button" 
                                                    onClick={() => setActiveMapPicker({ field: 'campuses', index: idx })}
                                                    className="bg-white border text-gray-500 border-gray-200 px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 hover:bg-gray-50 hover:text-orange-500 transition-colors"
                                                    title="Pilih Manual di Peta"
                                                >
                                                    📍 Peta
                                                </button>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    value={campus.distance}
                                                    onChange={(e) => updateObjectArrayItem('campuses', idx, 'distance', e.target.value)}
                                                    className="w-32 bg-white border border-orange-200 rounded-lg px-3 py-2 text-sm font-medium outline-none focus:border-orange-500"
                                                    placeholder="Jarak"
                                                />
                                                <button type="button" onClick={() => removeObjectArrayItem('campuses', idx)} className="text-red-400 hover:text-red-600 bg-white p-2 border border-red-100 rounded-lg transition-colors shrink-0">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                </button>
                                            </div>
                                        </div>
                                        {campus.distance && (() => {
                                            const kmMatch = campus.distance.match(/[\d.]+/);
                                            if (kmMatch) {
                                                const km = parseFloat(kmMatch[0]);
                                                const walk = Math.ceil((km / 5) * 60);
                                                const moto = Math.ceil((km / 30) * 60) + 2;
                                                const car = Math.ceil((km / 20) * 60) + 5;
                                                return (
                                                    <div className="flex flex-wrap items-center gap-2 bg-white px-3 py-2 rounded-lg border border-orange-100 w-full mt-2">
                                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-2">Estimasi Waktu:</span>
                                                        <div className="flex items-center gap-3 text-xs font-bold text-gray-600">
                                                            <span className="flex items-center gap-1">🚶 {walk} Mnt</span>
                                                            <span className="text-gray-300">•</span>
                                                            <span className="flex items-center gap-1">🏍️ {moto} Mnt</span>
                                                            <span className="text-gray-300">•</span>
                                                            <span className="flex items-center gap-1">🚗 {car} Mnt</span>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })()}
                                    </div>
                                ))}
                                <button type="button" onClick={() => addObjectArrayItem('campuses')} className="text-xs font-bold text-orange-600 hover:bg-orange-50 px-3 py-2 border border-orange-200 rounded-lg transition-colors">
                                    + Tambah Kampus Dekat Sini
                                </button>
                            </div>
                        </div>

                        {/* FASILITAS PUBLIK (ARRAY) */}
                        <div className="space-y-4 pt-4 border-t border-gray-100">
                            <h3 className="font-bold text-gray-900 border-l-4 border-blue-500 pl-3">Fasilitas Publik Area Sekitar</h3>
                            <div className="space-y-3">
                                {formData.publicFacilities?.map((fac, idx) => (
                                    <div key={idx} className="flex flex-col gap-3 items-start bg-blue-50 p-4 rounded-xl border border-blue-100">
                                        <div className="flex flex-col sm:flex-row gap-4 w-full items-start sm:items-center">
                                            <div className="flex-1 flex gap-2 w-full">
                                                <input
                                                    type="text"
                                                    value={fac.name}
                                                    onChange={(e) => updateObjectArrayItem('publicFacilities', idx, 'name', e.target.value)}
                                                    className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:border-blue-500"
                                                    placeholder="Nama Tempat (Misal: Halte Busway)"
                                                />
                                                <button 
                                                    type="button" 
                                                    onClick={() => searchFacilityCoordinates('publicFacilities', idx, fac.name)}
                                                    disabled={isSearchingFacilityMap[`publicFacilities-${idx}`]}
                                                    className="bg-blue-500 text-white px-3 py-2 rounded-lg text-xs font-bold shrink-0 hover:bg-blue-600 disabled:opacity-50"
                                                >
                                                    {isSearchingFacilityMap[`publicFacilities-${idx}`] ? 'Mencari...' : 'Cari Koordinat'}
                                                </button>
                                                <button 
                                                    type="button" 
                                                    onClick={() => setActiveMapPicker({ field: 'publicFacilities', index: idx })}
                                                    className="bg-white border text-gray-500 border-gray-200 px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 hover:bg-gray-50 hover:text-blue-500 transition-colors"
                                                    title="Pilih Manual di Peta"
                                                >
                                                    📍 Peta
                                                </button>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    value={fac.distance}
                                                    onChange={(e) => updateObjectArrayItem('publicFacilities', idx, 'distance', e.target.value)}
                                                    className="w-32 bg-white border border-blue-200 rounded-lg px-3 py-2 text-sm font-medium outline-none focus:border-blue-500"
                                                    placeholder="Jarak"
                                                />
                                                <button type="button" onClick={() => removeObjectArrayItem('publicFacilities', idx)} className="text-red-400 hover:text-red-600 bg-white p-2 border border-red-100 rounded-lg transition-colors shrink-0">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                </button>
                                            </div>
                                        </div>
                                        {fac.distance && (() => {
                                            const kmMatch = fac.distance.match(/[\d.]+/);
                                            if (kmMatch) {
                                                const km = parseFloat(kmMatch[0]);
                                                const walk = Math.ceil((km / 5) * 60);
                                                const moto = Math.ceil((km / 30) * 60) + 2;
                                                const car = Math.ceil((km / 20) * 60) + 5;
                                                return (
                                                    <div className="flex flex-wrap items-center gap-2 bg-white px-3 py-2 rounded-lg border border-blue-100 w-full mt-2">
                                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-2">Estimasi Waktu:</span>
                                                        <div className="flex items-center gap-3 text-xs font-bold text-gray-600">
                                                            <span className="flex items-center gap-1">🚶 {walk} Mnt</span>
                                                            <span className="text-gray-300">•</span>
                                                            <span className="flex items-center gap-1">🏍️ {moto} Mnt</span>
                                                            <span className="text-gray-300">•</span>
                                                            <span className="flex items-center gap-1">🚗 {car} Mnt</span>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })()}
                                    </div>
                                ))}
                                <button type="button" onClick={() => addObjectArrayItem('publicFacilities')} className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-2 border border-blue-200 rounded-lg transition-colors">
                                    + Tambah Fasilitas Publik
                                </button>
                            </div>
                        </div>
                    </div>
                );
            case 'media':
                return (
                    <div className="space-y-8">
                        {/* Images Section */}
                        <div className="space-y-4">
                            <h4 className="font-bold text-gray-900">Galeri Foto</h4>

                            {formData.imageUrls && formData.imageUrls.length > 0 && (
                                <div className="grid grid-cols-4 gap-4 mb-4">
                                    {formData.imageUrls.map((url, i) => (
                                        <div 
                                            key={`existing-${i}`} 
                                            className="relative aspect-square rounded-xl overflow-hidden group cursor-move hover:ring-2 hover:ring-orange-500 transition-all"
                                            draggable
                                            onDragStart={(e) => handleMediaDragStart(e, i, 'existing')}
                                            onDragEnd={handleMediaDragEnd}
                                            onDragOver={handleMediaDragOver}
                                            onDrop={(e) => handleMediaDrop(e, i, 'existing')}
                                        >
                                            <img src={url} className="w-full h-full object-cover" alt="" />
                                            <button type="button" onClick={() => removeExistingMedia('imageUrls', url)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                                            <div className="absolute bottom-1 left-1 bg-black/50 text-white text-[8px] px-1 rounded flex items-center gap-1 font-bold">
                                                <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                                                {i + 1}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {newImageFiles.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-xs text-green-600 font-bold">Foto Baru:</p>
                                    <div className="grid grid-cols-4 gap-4">
                                        {newImageFiles.map((file, i) => (
                                            <div 
                                                key={`new-${i}`} 
                                                className="relative aspect-square rounded-xl overflow-hidden group border-2 border-green-200 cursor-move hover:ring-2 hover:ring-green-500 transition-all"
                                                draggable
                                                onDragStart={(e) => handleMediaDragStart(e, i, 'new')}
                                                onDragEnd={handleMediaDragEnd}
                                                onDragOver={handleMediaDragOver}
                                                onDrop={(e) => handleMediaDrop(e, i, 'new')}
                                            >
                                                <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" alt="" />
                                                <button type="button" onClick={() => removeNewImage(i)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                                                <div className="absolute bottom-1 left-1 bg-green-500/80 text-white text-[8px] px-1 rounded flex items-center gap-1 font-bold">
                                                    <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                                                    {i + 1}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-2xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <svg className="w-8 h-8 mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    <p className="text-sm text-gray-500 font-bold">Klik untuk upload foto</p>
                                </div>
                                <input type="file" className="hidden" multiple accept="image/*" onChange={handleImageFileSelect} />
                            </label>
                        </div>

                        {/* Videos Section */}
                        <div className="space-y-4 pt-4 border-t border-gray-200">
                            <h4 className="font-bold text-gray-900">Video Tour</h4>

                            {formData.videoUrls && formData.videoUrls.length > 0 && (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                                    {formData.videoUrls.map((url, i) => (
                                        <div key={i} className="relative aspect-video rounded-xl overflow-hidden group bg-black">
                                            <video src={url} className="w-full h-full object-cover opacity-60" />
                                            <button type="button" onClick={() => removeExistingMedia('videoUrls', url)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 z-10"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {newVideoFiles.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-xs text-green-600 font-bold">Video Baru:</p>
                                    <div className="grid grid-cols-3 gap-4">
                                        {newVideoFiles.map((file, i) => (
                                            <div key={i} className="relative aspect-video rounded-xl overflow-hidden group border-2 border-green-200 bg-gray-100 flex items-center justify-center">
                                                <span className="text-xs font-bold text-gray-500">{file.name}</span>
                                                <button type="button" onClick={() => removeNewVideo(i)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-2xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <svg className="w-8 h-8 mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                    <p className="text-sm text-gray-500 font-bold">Klik untuk upload video</p>
                                </div>
                                <input type="file" className="hidden" multiple accept="video/*" onChange={handleVideoFileSelect} />
                            </label>
                        </div>

                        {/* Social Media Links Section */}
                        <div className="space-y-4 pt-4 border-t border-gray-200">
                            <h4 className="font-bold text-gray-900">Tautan Review Social Media</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Instagram Review Link</label>
                                    <input type="text" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none" value={formData.instagramUrl} onChange={e => setFormData({ ...formData, instagramUrl: e.target.value })} placeholder="https://instagram.com/reel/..." />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">TikTok Review Link</label>
                                    <input type="text" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none" value={formData.tiktokUrl} onChange={e => setFormData({ ...formData, tiktokUrl: e.target.value })} placeholder="https://tiktok.com/@..." />
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'facilities':
                return (
                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <input type="text" value={tempFacilityInput} onChange={e => setTempFacilityInput(e.target.value)} placeholder="Tambah Fasilitas (Contoh: WiFi, Parkir)" className="flex-grow bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none" onKeyPress={e => e.key === 'Enter' && tempFacilityInput.trim() && (e.preventDefault(), addArrayItem('facilities', tempFacilityInput.trim()), setTempFacilityInput(''))} />
                            <button type="button" onClick={() => { if (tempFacilityInput.trim()) { addArrayItem('facilities', tempFacilityInput.trim()); setTempFacilityInput(''); } }} className="bg-gray-900 text-white px-6 rounded-xl font-bold">Tambah</button>
                        </div>
                        <div className="flex flex-wrap gap-2 pt-2">
                            {formData.facilities?.map((f, i) => (
                                <div key={i} className="bg-white border border-gray-200 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
                                    {f}
                                    <button type="button" onClick={() => removeArrayItem('facilities', i)} className="text-red-500 hover:bg-red-50 rounded-full p-1"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg></button>
                                </div>
                            ))}
                        </div>

                        <div className="pt-8 mt-4 border-t-2 border-dashed border-gray-200 space-y-4">
                            <h3 className="font-bold text-gray-900 border-l-4 border-orange-500 pl-3">Biaya Tambahan (Opsional)</h3>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Keterangan Biaya Tambahan</label>
                                    <input type="text" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-orange-500" value={formData.additionalFeeName || ''} onChange={e => setFormData({ ...formData, additionalFeeName: e.target.value })} placeholder="Contoh: Air, Listrik, Sampah, WiFi" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Total Nominal Ekstra</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">Rp</span>
                                        <input type="number" min="0" className="w-full bg-white border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-sm font-bold outline-none focus:border-orange-500" value={formData.additionalFeePrice || ''} onChange={e => setFormData({ ...formData, additionalFeePrice: e.target.value ? parseInt(e.target.value) : 0 })} placeholder="Contoh: 50000" />
                                    </div>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 italic">Isi jika kost menetapkan tagihan wajib bulanan di luar tagihan pokok kamar.</p>
                        </div>
                    </div >
                );
            case 'rooms':
                return (
                    <div className="space-y-8">
                        {formData.roomTypes?.map((room, idx) => (
                            <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-200 space-y-4 relative">
                                <button type="button" onClick={() => removeRoomType(idx)} className="absolute top-4 right-4 text-red-500 hover:bg-red-50 p-2 rounded-xl text-xs font-bold">Hapus Tipe Kamar</button>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-12">
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nama Tipe</label>
                                        <input type="text" className="w-full border-b-2 border-gray-100 py-2 font-bold focus:border-orange-500 outline-none" value={room.name} onChange={e => updateRoomType(idx, 'name', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ukuran</label>
                                        <input type="text" className="w-full border-b-2 border-gray-100 py-2 font-bold focus:border-orange-500 outline-none" value={room.size} onChange={e => updateRoomType(idx, 'size', e.target.value)} />
                                    </div>
                                </div>

                                {/* PRICING SCHEMES */}
                                <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100">
                                    <label className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-3 block">Skema Harga</label>
                                    <div className="space-y-3">
                                        {room.pricing?.map((scheme, pIdx) => (
                                            <div key={pIdx} className="flex gap-4 items-center">
                                                <select
                                                    value={scheme.period}
                                                    onChange={(e) => updateRoomPricing(idx, pIdx, 'period', e.target.value)}
                                                    className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs font-bold"
                                                >
                                                    <option value="bulanan">Bulanan</option>
                                                    <option value="3bulanan">3 Bulan</option>
                                                    <option value="6bulanan">6 Bulan</option>
                                                    <option value="tahunan">Tahunan</option>
                                                    <option value="mingguan">Mingguan</option>
                                                    <option value="harian">Harian</option>
                                                </select>
                                                <input
                                                    type="number"
                                                    value={scheme.price}
                                                    onChange={(e) => updateRoomPricing(idx, pIdx, 'price', Number(e.target.value))}
                                                    className="flex-grow bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs font-bold"
                                                    placeholder="Harga"
                                                />
                                                <button type="button" onClick={() => removeRoomPricing(idx, pIdx)} className="text-red-400 hover:text-red-600"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                                            </div>
                                        ))}
                                        <button type="button" onClick={() => addRoomPricing(idx)} className="text-xs font-bold text-orange-600 hover:underline">+ Tambah Skema Harga</button>
                                    </div>
                                </div>

                                {/* Maks Penghuni & Charge Logic */}
                                {(() => {
                                    const periodWeights: Record<string, number> = {
                                        'harian': 1, 'mingguan': 7, 'bulanan': 30, '3bulanan': 90, '6bulanan': 180, 'tahunan': 360
                                    };
                                    const periodLabels: Record<string, string> = {
                                        'harian': 'Harian', 'mingguan': 'Mingguan', 'bulanan': 'Bulanan', '3bulanan': '3 Bulan', '6bulanan': '6 Bulan', 'tahunan': 'Tahunan'
                                    };

                                    const activePeriods = room.pricing?.filter(p => p.price > 0).map(p => p.period) || [];
                                    const lowestPeriod = activePeriods.length > 0 
                                        ? activePeriods.reduce((min, p) => periodWeights[p] < periodWeights[min] ? p : min, activePeriods[0]) 
                                        : 'bulanan';
                                    
                                    const lowestPeriodLabel = periodLabels[lowestPeriod] || 'Bulanan';

                                    return (
                                        <div className="grid grid-cols-2 gap-4 mt-4 py-4 border-t border-gray-100">
                                            <div>
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Maks. Penghuni</p>
                                                <input type="number" min="1" placeholder="Maks. 1" value={room.maxOccupants || ''} onChange={e => updateRoomType(idx,'maxOccupants',parseInt(e.target.value) || 1)} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:border-orange-500" />
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">
                                                    {'Biaya Tambahan (> 1 Penghuni)'} (Per {lowestPeriodLabel})
                                                </p>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-bold">Rp</span>
                                                    <input type="number" min="0" placeholder="0" value={room.additionalCostPerPerson || ''} onChange={e => updateRoomType(idx,'additionalCostPerPerson',parseInt(e.target.value) || 0)} className="w-full bg-white border border-gray-200 rounded-lg pl-8 pr-3 py-2 text-sm font-bold outline-none focus:border-orange-500" />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* FEATURES TAGS */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Fasilitas Kamar</label>
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {room.roomFacilities?.map((tag, tIdx) => (
                                                <span key={tIdx} className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-bold flex items-center gap-1">{tag} <button type="button" onClick={() => removeRoomTag(idx, 'roomFacilities', tIdx)}>&times;</button></span>
                                            ))}
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="+ Tambah (Enter)"
                                            className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2"
                                            value={tempTagInput[`${idx}-roomFacilities`] || ''}
                                            onChange={(e) => setTempTagInput({ ...tempTagInput, [`${idx}-roomFacilities`]: e.target.value })}
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    addRoomTag(idx, 'roomFacilities', (e.target as HTMLInputElement).value);
                                                }
                                            }}
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Fasilitas Kamar Mandi</label>
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {room.bathroomFacilities?.map((tag, tIdx) => (
                                                <span key={tIdx} className="bg-blue-50 text-blue-600 px-2 py-1 rounded text-xs font-bold flex items-center gap-1">{tag} <button type="button" onClick={() => removeRoomTag(idx, 'bathroomFacilities', tIdx)}>&times;</button></span>
                                            ))}
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="+ Tambah (Enter)"
                                            className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2"
                                            value={tempTagInput[`${idx}-bathroomFacilities`] || ''}
                                            onChange={(e) => setTempTagInput({ ...tempTagInput, [`${idx}-bathroomFacilities`]: e.target.value })}
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    addRoomTag(idx, 'bathroomFacilities', (e.target as HTMLInputElement).value);
                                                }
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={room.isAvailable !== false} onChange={e => updateRoomType(idx, 'isAvailable', e.target.checked)} className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500" />
                                        <span className="text-sm font-bold text-gray-700">Kamar Tersedia</span>
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Jumlah Sisa Kamar:</span>
                                        <input 
                                            type="number" 
                                            min="0" 
                                            className="w-16 border-b-2 border-gray-100 py-1 text-center font-bold focus:border-orange-500 outline-none text-sm" 
                                            placeholder="0" 
                                            value={room.availableRoomCount || 0} 
                                            onChange={e => updateRoomType(idx, 'availableRoomCount', e.target.value)} 
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                        <button type="button" onClick={addRoomType} className="w-full py-4 border-2 border-dashed border-gray-300 rounded-2xl text-gray-500 font-bold hover:border-orange-500 hover:text-orange-500 transition-colors">
                            + Tambah Tipe Kamar
                        </button>
                    </div>
                );
            case 'rules':
                return (
                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <input type="text" value={tempRuleInput} onChange={e => setTempRuleInput(e.target.value)} placeholder="Tambah Peraturan (Contoh: Dilarang bawa hewan peliharaan)" className="flex-grow bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none" onKeyPress={e => e.key === 'Enter' && tempRuleInput.trim() && (e.preventDefault(), addArrayItem('rules', tempRuleInput.trim()), setTempRuleInput(''))} />
                            <button type="button" onClick={() => { if (tempRuleInput.trim()) { addArrayItem('rules', tempRuleInput.trim()); setTempRuleInput(''); } }} className="bg-gray-900 text-white px-6 rounded-xl font-bold">Tambah</button>
                        </div>
                        <div className="space-y-2">
                            {formData.rules?.map((r, i) => (
                                <div key={i} className="bg-white border border-gray-200 px-4 py-3 rounded-xl text-sm font-medium flex justify-between items-center">
                                    <span className="text-gray-700">{i + 1}. {r}</span>
                                    <button type="button" onClick={() => removeArrayItem('rules', i)} className="text-red-500 hover:bg-red-50 rounded-lg p-2 font-bold text-xs"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg></button>
                                </div>
                            ))}
                            {(!formData.rules || formData.rules.length === 0) && (
                                <p className="text-sm text-gray-500 italic py-4 text-center">Belum ada peraturan ditambahkan.</p>
                            )}
                        </div>
                    </div>
                );
            default: return null;
        }
    };

    // --- REALTIME TRANSACTIONS STATE ---



    const loadRentTransactions = async () => {
        setLoading(true);
        try {
            if (isAdmin) {
                const data = await getAdminTransactions(undefined, dashboardViewMode === 'personal' ? uid : undefined);
                // Stricter filtering: Exclude 70,000 amount (survey price) and explicitly allow rental types
                const filtered = (data || []).filter((t: any) => 
                    (t.product_type === 'kost_booking' || t.product_type === 'perpanjangan_sewa' || t.product_type === 'rent') && 
                    Number(t.amount) !== 70000
                );
                setRentTransactions(filtered);
            } else if (uid) {
                const data = await getUserTransactions(uid);
                const filtered = (data || []).filter((t: any) => 
                    (t.product_type === 'kost_booking' || t.product_type === 'perpanjangan_sewa' || t.product_type === 'rent') && 
                    Number(t.amount) !== 70000
                );
                setRentTransactions(filtered);
            }
        } catch (error) {
            console.error("Gagal memuat transaksi sewa kost", error);
        } finally {
            setLoading(false);
            setSelectedRentTrxIds([]);
        }
    };

    const handleDeleteRentTransaction = async (id: string) => {
        if (!window.confirm('Apakah Anda yakin ingin menghapus riwayat transaksi ini? Data yang dihapus tidak dapat dikembalikan.')) return;

        setLoading(true);
        try {
            await deleteTransaction(id);
            alert('Transaksi berhasil dihapus');
            loadRentTransactions();
        } catch (error: any) {
            alert('Gagal menghapus transaksi: ' + (error.message || 'Terjadi kesalahan'));
        } finally {
            setLoading(false);
        }
    };

    const handleBulkDeleteRentTransactions = async () => {
        if (selectedRentTrxIds.length === 0) return;
        if (!window.confirm(`Apakah Anda yakin ingin menghapus ${selectedRentTrxIds.length} transaksi terpilih? Data yang dihapus tidak dapat dikembalikan.`)) return;

        setLoading(true);
        try {
            await deleteTransactions(selectedRentTrxIds);
            alert(`${selectedRentTrxIds.length} transaksi berhasil dihapus`);
            loadRentTransactions();
        } catch (error: any) {
            alert('Gagal menghapus transaksi: ' + (error.message || 'Terjadi kesalahan'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeMenu === 'transactions_rent') {
            loadRentTransactions();

            const channel = supabase.channel('realtime_rent_trx')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
                    loadRentTransactions();
                })
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
        
        if (activeMenu === 'mitra' && isAdmin) {
            loadMitraRequests();
        }
    }, [activeMenu, isAdmin, uid, dashboardViewMode]);

    const loadMitraRequests = async () => {
        setLoading(true);
        try {
            const data = await getAdminMitraRequests();
            setMitraRequests(data);
        } catch (err) {
            console.error('Failed to load mitra requests:', err);
        } finally {
            setLoading(false);
        }
    };

    const [dummyVerifications, setDummyVerifications] = useState<any[]>([
        {
            id: 'SRV-2026-001',
            // Profil Pemesan
            name: 'Rizal Firmansyah',
            email: 'rizal.firmansyah@gmail.com',
            phone: '6281388990011',
            photoURL: 'https://i.pravatar.cc/150?img=3',
            // Detail Kost Tujuan
            kostName: 'Kost Bintang Mas (Link: goo.gl/maps/xxx)',
            ownerPhone: '6281234000111',
            kostAddress: 'Jl. Babakan Raya No. 12, Dramaga, Bogor 16680',
            source: 'Database RuangSinggah',
            // Jadwal Video Call
            surveyDate: '2026-03-05',
            surveyTime: '10:00',
            notes: 'Tolong cek air kamar mandi dan pastikan ada ventilasi / jendela yang bisa dibuka. Cek juga sinyal wifi di dalam kamar.',
            // Pesanan
            date: '2026-02-24',
            status: 'Menunggu',
            amount: 70000,
            platformFee: 0,
            invoiceId: 'INV-SRV-001',
            paymentType: 'transfer',
            paymentMethod: 'Transfer Bank BRI',
            transferProofUrl: 'https://images.unsplash.com/photo-1554774853-d50f9c681ae2?w=600&q=80',
        },
        {
            id: 'SRV-2026-002',
            name: 'Dita Amelia',
            email: 'dita.amelia@outlook.com',
            phone: '6285299887766',
            photoURL: 'https://i.pravatar.cc/150?img=9',
            kostName: 'Kost Melati Indah Depok',
            ownerPhone: '6287788990000',
            kostAddress: 'Jl. Margonda Raya No. 99, Beji, Depok 16423',
            source: 'Sosial Media (IG/TikTok)',
            surveyDate: '2026-03-07',
            surveyTime: '14:00',
            notes: 'Cek sinyal internet di kamar, akses kunci pagar malam hari, dan kondisi kamar mandi bersama.',
            date: '2026-02-25',
            status: 'Dijadwalkan',
            amount: 70000,
            platformFee: 0,
            invoiceId: 'INV-SRV-002',
            paymentType: 'gateway',
            paymentMethod: 'Midtrans - QRIS',
            transferProofUrl: null,
        },
    ]);


    const handleSurveyPhotoUpload = async (fieldId: string, files: FileList | null) => {
        if (!files || files.length === 0 || !isEditingSurvey) return;

        setIsUploadingSurveyPhoto(fieldId);
        try {
            const urls: string[] = [];
            for (let i = 0; i < files.length; i++) {
                const url = await uploadSurveyPhoto(files[i], isEditingSurvey.id);
                urls.push(url);
            }

            const photoField = `${fieldId}_photos`;
            const currentSummary = (surveyForm.evaluation_summary as any) || {};
            const existingPhotos = currentSummary[photoField] || [];

            setSurveyForm({
                ...surveyForm,
                evaluation_summary: {
                    ...currentSummary,
                    [photoField]: [...existingPhotos, ...urls]
                }
            });
        } catch (error) {
            alert('Gagal mengupload foto survey');
            console.error(error);
        } finally {
            setIsUploadingSurveyPhoto(null);
        }
    };

    const handleRemoveSurveyPhoto = async (fieldId: string, photoUrl: string) => {
        if (!isEditingSurvey || !window.confirm('Hapus foto ini?')) return;

        try {
            await deleteSurveyPhoto(photoUrl);

            const photoField = `${fieldId}_photos`;
            const currentSummary = (surveyForm.evaluation_summary as any) || {};
            const existingPhotos = currentSummary[photoField] || [];

            setSurveyForm({
                ...surveyForm,
                evaluation_summary: {
                    ...currentSummary,
                    [photoField]: existingPhotos.filter((url: string) => url !== photoUrl)
                }
            });
        } catch (error) {
            console.error('Gagal menghapus foto:', error);
        }
    };

    const renderSidebar = () => (
        <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-80px)] hidden md:flex flex-col sticky top-20 z-10">
            <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">
                    {isAdmin ? 'Admin Panel' : isOwner ? 'Owner Panel' : 'Agent Panel'}
                </h2>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Sistem Manajemen</p>
            </div>
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {/* --- KATALOG UTAMA --- */}
                <div className="pb-2">
                    <p className="px-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Katalog Utama</p>
                </div>
                
                {(isAdmin || isOwner) && (
                    <SidebarItem icon="📊" label="Ringkasan Analisis" isActive={activeMenu === 'analytics'} onClick={() => handleMenuChange('analytics')} />
                )}
                
                {(isAdmin || isOwner) && (
                    <SidebarItem icon="🏠" label="Kelola Kost" isActive={activeMenu === 'properties'} onClick={() => handleMenuChange('properties')} />
                )}

                {isAdmin && (
                    <>
                        <SidebarItem icon="🗄️" label="Kelola Database" isActive={activeMenu === 'databases'} onClick={() => handleMenuChange('databases')} />
                        <SidebarItem icon="🗒️" label="Katalog Survey" isActive={activeMenu === 'verification'} onClick={() => handleMenuChange('verification')} />
                    </>
                )}

                {/* --- TRANSAKSI --- */}
                <div className="pt-6 pb-2">
                    <p className="px-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        {isAgent ? 'Tugas Survey' : 'Transaksi'}
                    </p>
                </div>

                {isAgent && (
                    <>
                        <SidebarItem icon="✅" label="Survey Saya" isActive={activeMenu === 'my_surveys'} onClick={() => handleMenuChange('my_surveys')} />
                        <SidebarItem icon="💰" label="Penghasilan" isActive={activeMenu === 'agent_wallet'} onClick={() => handleMenuChange('agent_wallet')} />
                    </>
                )}

                {(isAdmin || isOwner) && (
                    <SidebarItem icon="🛒" label="Sewa Kost" isActive={activeMenu === 'transactions_rent'} onClick={() => handleMenuChange('transactions_rent')} />
                )}

                {isAdmin && (
                    <>
                        <SidebarItem icon="📦" label="Pembelian DB" isActive={activeMenu === 'transactions_db'} onClick={() => handleMenuChange('transactions_db')} />
                        <SidebarItem icon="✅" label="Jasa Survey" isActive={activeMenu === 'verifikasi'} onClick={() => handleMenuChange('verifikasi')} />
                    </>
                )}

                {/* --- MANAJEMEN --- */}
                {!isAgent && (
                    <div className="pt-6 pb-2">
                        <p className="px-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Manajemen</p>
                    </div>
                )}

                {isAdmin && (
                    <>
                        <SidebarItem icon="👥" label="Kelola User" isActive={activeMenu === 'tenants'} onClick={() => handleMenuChange('tenants')} />
                        <SidebarItem icon="🤝" label="Kelola Mitra" isActive={activeMenu === 'mitra'} onClick={() => handleMenuChange('mitra')} />
                        <SidebarItem icon="🛡️" label="Kelola Agen" isActive={activeMenu === 'agent_verification'} onClick={() => handleMenuChange('agent_verification')} />
                        <SidebarItem icon="🖼️" label="Banner Promo" isActive={activeMenu === 'banners'} onClick={() => handleMenuChange('banners')} />
                    </>
                )}

                {(isAdmin || isOwner) && (
                    <SidebarItem icon="🛠️" label="Komplain" isActive={activeMenu === 'complaints'} onClick={() => handleMenuChange('complaints')} />
                )}
            </nav>
        </aside>
    );

    const SidebarItem = ({ icon, label, isActive, onClick }: { icon: string, label: string, isActive: boolean, onClick: () => void }) => (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${isActive ? 'bg-orange-50 text-orange-600 font-bold' : 'text-gray-600 hover:bg-gray-50 font-semibold'
                }`}
        >
            <span className="text-lg">{icon}</span>
            <span className="text-xs uppercase tracking-wide">{label}</span>
        </button>
    );

    const currentYear = new Date().getFullYear();

    // --- DUMMY DATA UNTUK GRAFIK ---
    const generateTrendData = (filter: string, startDate?: string, endDate?: string, year?: string) => {
        if (filter === 'hari_ini') {
            return [
                { time: '00:00', pengguna: 5, sewa: 0, db: 1, verifikasi: 1, pendapatan: 500000 },
                { time: '04:00', pengguna: 8, sewa: 1, db: 2, verifikasi: 0, pendapatan: 800000 },
                { time: '08:00', pengguna: 25, sewa: 3, db: 5, verifikasi: 2, pendapatan: 2500000 },
                { time: '12:00', pengguna: 45, sewa: 8, db: 12, verifikasi: 4, pendapatan: 5200000 },
                { time: '16:00', pengguna: 35, sewa: 6, db: 9, verifikasi: 3, pendapatan: 4000000 },
                { time: '20:00', pengguna: 55, sewa: 12, db: 18, verifikasi: 6, pendapatan: 7500000 },
            ];
        } else if (filter === 'minggu_ini') {
            return [
                { time: 'Sen', pengguna: 120, sewa: 15, db: 25, verifikasi: 8, pendapatan: 12500000 },
                { time: 'Sel', pengguna: 85, sewa: 10, db: 18, verifikasi: 5, pendapatan: 8500000 },
                { time: 'Rab', pengguna: 150, sewa: 22, db: 30, verifikasi: 12, pendapatan: 18000000 },
                { time: 'Kam', pengguna: 110, sewa: 14, db: 22, verifikasi: 7, pendapatan: 11000000 },
                { time: 'Jum', pengguna: 90, sewa: 12, db: 20, verifikasi: 6, pendapatan: 9500000 },
                { time: 'Sab', pengguna: 180, sewa: 25, db: 40, verifikasi: 15, pendapatan: 22000000 },
                { time: 'Min', pengguna: 210, sewa: 30, db: 45, verifikasi: 20, pendapatan: 27000000 },
            ];
        } else if (filter === 'bulan_ini') {
            return [
                { time: 'Minggu 1', pengguna: 450, sewa: 60, db: 120, verifikasi: 35, pendapatan: 55000000 },
                { time: 'Minggu 2', pengguna: 520, sewa: 75, db: 140, verifikasi: 42, pendapatan: 68000000 },
                { time: 'Minggu 3', pengguna: 480, sewa: 65, db: 130, verifikasi: 38, pendapatan: 62000000 },
                { time: 'Minggu 4', pengguna: 610, sewa: 85, db: 160, verifikasi: 50, pendapatan: 81000000 },
            ];
        } else if (filter === 'tahunan') {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
            const multiplier = year === '2025' ? 0.8 : year === '2026' ? 1.2 : 1.5;
            return months.map(m => ({
                time: m,
                pengguna: Math.floor((Math.random() * 500 + 500) * multiplier),
                sewa: Math.floor((Math.random() * 50 + 50) * multiplier),
                db: Math.floor((Math.random() * 80 + 80) * multiplier),
                verifikasi: Math.floor((Math.random() * 40 + 20) * multiplier),
                pendapatan: Math.floor((Math.random() * 50000000 + 50000000) * multiplier)
            }));
        } else if (filter === 'custom' && startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            if (end < start) return [{ time: 'Error Date', pengguna: 0, sewa: 0, db: 0, pendapatan: 0 }];

            const diffTime = Math.abs(end.getTime() - start.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            const points = [];
            const dataCount = diffDays <= 14 ? diffDays + 1 : diffDays <= 30 ? 4 : Math.ceil(diffDays / 7);
            const interval = diffDays <= 14 ? 1 : diffDays <= 30 ? 7 : Math.ceil(diffDays / dataCount);

            let currentDate = new Date(start);
            for (let i = 0; i < dataCount; i++) {
                if (currentDate > end) break;
                const label = diffDays <= 14
                    ? `${currentDate.getDate()}/${currentDate.getMonth() + 1}`
                    : `P${i + 1} (${currentDate.getDate()}/${currentDate.getMonth() + 1})`;

                points.push({
                    time: label,
                    pengguna: Math.floor(Math.random() * 400 + 200),
                    sewa: Math.floor(Math.random() * 30 + 10),
                    db: Math.floor(Math.random() * 50 + 20),
                    verifikasi: Math.floor(Math.random() * 20 + 5),
                    pendapatan: Math.floor(Math.random() * 30000000 + 10000000)
                });
                currentDate.setDate(currentDate.getDate() + interval);
            }
            if (points.length === 0) {
                points.push({ time: `${start.getDate()}/${start.getMonth() + 1}`, pengguna: 10, sewa: 1, db: 2, verifikasi: 1, pendapatan: 1000000 });
            }
            return points;
        } else {
            // Filter "Semua Waktu" -> Data per tahun dari 2025 sampai tahun sekarang
            const years = Array.from({ length: currentYear - 2025 + 1 }, (_, i) => 2025 + i);
            return years.map(y => ({
                time: y.toString(),
                pengguna: Math.floor(Math.random() * 2000 + 1000),
                sewa: Math.floor(Math.random() * 200 + 50),
                db: Math.floor(Math.random() * 300 + 100),
                verifikasi: Math.floor(Math.random() * 150 + 50),
                pendapatan: Math.floor(Math.random() * 200000000 + 100000000)
            }));
        }
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-gray-100 shadow-xl rounded-xl z-50">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={index} className="text-xs font-bold" style={{ color: entry.color }}>
                            {entry.name}: {entry.name.toLowerCase().includes('pendapatan') ? FORMAT_CURRENCY(entry.value) : entry.value}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    const getMaxEndDate = () => {
        if (!customStartDate) return '';
        const start = new Date(customStartDate);
        const maxEnd = new Date(start);
        maxEnd.setMonth(start.getMonth() + 3);
        return maxEnd.toISOString().split('T')[0];
    };

    const renderAgentOverview = () => {
        const agentSurveys = surveyRequests.filter(r => r.assigned_agent_id === uid || r.agent_name?.toLowerCase().includes('arif')); // Fallback for dummy
        const completed = agentSurveys.filter(r => r.status === 'COMPLETED');
        const totalSurveys = agentSurveys.length;
        const completedCount = completed.length;
        
        const ratings = completed.map(r => r.user_rating || 0).filter(r => r > 0);
        const avgRating = ratings.length > 0 ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : '0.0';

        const latestFeedback = [...completed]
            .filter(r => r.user_rating || r.user_comment)
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 3);

        return (
            <div className="space-y-8 animate-in fade-in duration-500 pb-20">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Overview Performa</h2>
                    <p className="text-gray-500 text-sm mt-1">Ringkasan hasil kerja dan feedback dari klien Anda.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <StatCard title="Total Tugas" value={totalSurveys.toString()} icon="📋" color="bg-blue-50 text-blue-600" />
                    <StatCard title="Survey Selesai" value={completedCount.toString()} icon="✅" color="bg-green-50 text-green-600" />
                </div>

                {/* Weekly Orders Bar Chart */}
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-black text-gray-900 mb-1 flex items-center gap-2">
                        <span>📊</span> Pesanan Minggu Ini
                    </h3>
                    <p className="text-xs text-gray-400 font-medium mb-6">Jumlah pesanan survey dalam 7 hari terakhir</p>
                    {(() => {
                        const dayLabels = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
                        const now = new Date();
                        const weekData = Array.from({ length: 7 }, (_, i) => {
                            const d = new Date(now);
                            d.setDate(now.getDate() - (6 - i));
                            d.setHours(0, 0, 0, 0);
                            const nextD = new Date(d);
                            nextD.setDate(d.getDate() + 1);
                            const count = agentSurveys.filter(r => {
                                const created = new Date(r.created_at);
                                return created >= d && created < nextD;
                            }).length;
                            return {
                                day: dayLabels[d.getDay()],
                                date: `${d.getDate()}/${d.getMonth() + 1}`,
                                pesanan: count
                            };
                        });
                        const maxVal = Math.max(...weekData.map(d => d.pesanan), 1);
                        return (
                            <div className="flex items-end justify-between gap-2 h-40">
                                {weekData.map((item, idx) => (
                                    <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                                        <span className="text-xs font-black text-gray-900">{item.pesanan}</span>
                                        <div 
                                            className="w-full rounded-xl transition-all duration-500"
                                            style={{
                                                height: `${Math.max((item.pesanan / maxVal) * 100, 8)}%`,
                                                background: item.pesanan > 0 
                                                    ? 'linear-gradient(to top, #f97316, #fb923c)' 
                                                    : '#f3f4f6'
                                            }}
                                        />
                                        <div className="text-center">
                                            <p className="text-[10px] font-black text-gray-500 uppercase">{item.day}</p>
                                            <p className="text-[8px] text-gray-300 font-bold">{item.date}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        );
                    })()}
                </div>

                {/* Rating Rata-rata */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl bg-yellow-50 text-yellow-600">
                        ⭐
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Rating Rata-rata</p>
                        <div className="flex items-center gap-2 mt-1">
                            <p className="text-xl font-black text-gray-900">{avgRating}</p>
                            <div className="flex text-yellow-400 text-xs">
                                {[...Array(5)].map((_, i) => (
                                    <span key={i}>{i < Math.round(Number(avgRating)) ? '★' : '☆'}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
                        <span>💬</span> Rating & Komentar Terbaru
                    </h3>
                    {latestFeedback.length === 0 ? (
                        <div className="text-center py-10 text-gray-400 font-medium">Belum ada feedback dari klien.</div>
                    ) : (
                        <div className="space-y-4">
                            {latestFeedback.map((fb) => (
                                <div key={fb.id} className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-[10px] font-black text-orange-600">
                                                {fb.user?.name?.charAt(0) || 'U'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">{fb.user?.name || 'User'}</p>
                                                <p className="text-[10px] text-gray-400 font-medium">{new Date(fb.created_at).toLocaleDateString('id-ID')}</p>
                                            </div>
                                        </div>
                                        <div className="flex text-yellow-400 text-xs">
                                            {[...Array(5)].map((_, i) => (
                                                <span key={i}>{i < (fb.user_rating || 0) ? '★' : '☆'}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-600 italic px-1">"{fb.user_comment || 'Tidak ada komentar.'}"</p>
                                    <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase tracking-widest">{fb.kost_name}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    };



    const StatCard = ({ title, value, icon, color }: { title: string, value: string, icon: string, color: string }) => (
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${color}`}>
                {icon}
            </div>
            <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{title}</p>
                <p className="text-xl font-black text-gray-900 mt-1">{value}</p>
            </div>
        </div>
    );

    const renderTableView = (title: string, columns: string[], data: any[]) => (
        <div className="space-y-6">
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-2">{title}</h2>
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-500">
                        <thead className="bg-gray-50/50 text-xs font-black text-gray-500 uppercase tracking-widest">
                            <tr>
                                {columns.map((col, i) => <th key={i} className="px-6 py-4">{col}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row, i) => (
                                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                    {Object.values(row).map((val: any, j) => (
                                        <td key={j} className="px-6 py-4 font-medium text-gray-900">
                                            {typeof val === 'number' && j === Object.values(row).length - 1 ? FORMAT_CURRENCY(val) : val}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                            {data.length === 0 && (
                                <tr>
                                    <td colSpan={columns.length} className="px-6 py-12 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">Belum ada data</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    const renderAgentWallet = () => {
        const completedSurveys = surveyRequests.filter((r: SurveyRequest) => r.assigned_agent_id === uid && r.status === 'COMPLETED');
        const surveyRate = 50000;
        const totalEarnings = completedSurveys.length * surveyRate;
        const totalWithdrawn = agentWithdrawalHistory.filter(w => w.status !== 'Ditolak').reduce((sum, item) => sum + (item.amount || 0), 0);
        const netBalance = totalEarnings - totalWithdrawn;

        return (
            <div className="space-y-6 pb-20">
                {/* Balance Card + Withdraw Button */}
                <div className="bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 p-8 rounded-3xl shadow-xl relative overflow-hidden">
                    <div className="absolute right-0 bottom-0 text-[120px] leading-none text-white/10 -mr-6 -mb-10 pointer-events-none select-none">💰</div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-white/80 uppercase tracking-[0.2em] mb-2">Saldo Tersedia</p>
                        <h2 className="text-4xl font-black text-white tracking-tight">{FORMAT_CURRENCY(netBalance)}</h2>
                        <p className="text-xs text-white/60 font-medium mt-2">{completedSurveys.length} survey selesai • Rp {(surveyRate).toLocaleString('id-ID')}/survey</p>
                    </div>
                </div>

                <button 
                    onClick={() => {
                        if (netBalance < 50000) return alert('Saldo minimal penarikan adalah Rp 50.000');
                        if (!agentBankAccount || !agentBankAccountName) return alert('Silakan simpan profil rekening Anda terlebih dahulu di tab "Rekening Saya".');
                        setShowWithdrawConfirm(true);
                    }}
                    className="w-full bg-gray-900 hover:bg-gray-800 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all active:scale-[0.98] shadow-lg flex items-center justify-center gap-3"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Tarik Saldo
                </button>

                {/* Tabs */}
                <div className="flex bg-gray-100 p-1.5 rounded-2xl">
                    <button 
                        onClick={() => setWalletView('profile')}
                        className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${walletView === 'profile' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        Rekening Saya
                    </button>
                    <button 
                        onClick={() => setWalletView('history')}
                        className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${walletView === 'history' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        Riwayat
                    </button>
                </div>

                {walletView === 'profile' ? (
                    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm max-w-2xl">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-lg">🏦</div>
                            <div>
                                <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Rekening Penarikan</h3>
                                <p className="text-[10px] text-gray-400 font-medium">Data ini akan digunakan saat Anda melakukan penarikan saldo.</p>
                            </div>
                        </div>
                        <div className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pilih Bank</label>
                                <select 
                                    value={agentBankName}
                                    onChange={(e) => setAgentBankName(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-orange-500 transition-all outline-none"
                                >
                                    <option value="BCA">BCA (Bank Central Asia)</option>
                                    <option value="BNI">BNI (Bank Negara Indonesia)</option>
                                    <option value="BRI">BRI (Bank Rakyat Indonesia)</option>
                                    <option value="MANDIRI">MANDIRI</option>
                                    <option value="BSI">BSI (Bank Syariah Indonesia)</option>
                                    <option value="DANA">DANA (E-Wallet)</option>
                                    <option value="OVO">OVO (E-Wallet)</option>
                                    <option value="GOPAY">GoPay (E-Wallet)</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nomor Rekening / E-Wallet</label>
                                <input 
                                    type="text" 
                                    value={agentBankAccount}
                                    onChange={(e) => setAgentBankAccount(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-orange-500 transition-all outline-none" 
                                    placeholder="Masukkan nomor rekening..." 
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nama Pemilik Rekening</label>
                                <input 
                                    type="text" 
                                    value={agentBankAccountName}
                                    onChange={(e) => setAgentBankAccountName(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-orange-500 transition-all outline-none" 
                                    placeholder="Sesuai buku tabungan..." 
                                />
                            </div>
                            <button 
                                type="button"
                                onClick={saveAgentWalletProfile}
                                disabled={isSavingWalletProfile}
                                className="w-full bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-lg shadow-orange-200 active:scale-[0.98] disabled:opacity-50"
                            >
                                {isSavingWalletProfile ? 'Menyimpan...' : '💾 Simpan Rekening'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm">
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight mb-6">Riwayat Penarikan</h3>
                        {agentWithdrawalHistory.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="text-4xl mb-4">📝</div>
                                <h3 className="text-gray-900 font-bold mb-1">Belum Ada Riwayat</h3>
                                <p className="text-gray-500 text-sm">Anda belum pernah melakukan penarikan dana.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {agentWithdrawalHistory.map((item, idx) => (
                                    <div key={item.id || idx} className="border border-gray-100 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/50 hover:bg-white transition-colors">
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="bg-gray-200 text-gray-700 font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">{item.id}</span>
                                                <span className="text-xs font-medium text-gray-400">{new Date(item.date).toLocaleDateString('id-ID')}</span>
                                            </div>
                                            <p className="font-bold text-gray-900">{item.bank_name} - {item.bank_account}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">a.n {item.bank_account_name}</p>
                                        </div>
                                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 w-full sm:w-auto mt-2 sm:mt-0 pt-4 sm:pt-0 border-t border-gray-100 sm:border-0">
                                            <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full ${
                                                item.status === 'Selesai' || item.status === 'Sukses' ? 'bg-green-100 text-green-700' :
                                                item.status === 'Ditolak' ? 'bg-red-100 text-red-700' :
                                                'bg-yellow-100 text-yellow-700'
                                            }`}>
                                                {item.status === 'Menunggu' ? 'Diproses' : item.status || 'Diproses'}
                                            </span>
                                            <p className="font-black text-lg text-gray-900">- {FORMAT_CURRENCY(item.amount)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Withdrawal Confirmation Modal */}
                {showWithdrawConfirm && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-gray-900/70 backdrop-blur-sm" onClick={() => setShowWithdrawConfirm(false)} />
                        <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in-95 fade-in duration-300">
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </div>
                                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Konfirmasi Penarikan</h3>
                                <p className="text-sm text-gray-500 mt-1">Pastikan detail di bawah sudah benar.</p>
                            </div>

                            <div className="space-y-4 mb-8">
                                <div className="bg-green-50 border border-green-100 rounded-2xl p-5 text-center">
                                    <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-1">Jumlah Penarikan</p>
                                    <p className="text-3xl font-black text-green-700">{FORMAT_CURRENCY(netBalance)}</p>
                                </div>
                                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Rekening Tujuan</p>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white rounded-xl border border-gray-200 flex items-center justify-center text-lg">🏦</div>
                                        <div>
                                            <p className="font-black text-gray-900">{agentBankName}</p>
                                            <p className="text-sm text-gray-500 font-bold">{agentBankAccount} • a.n {agentBankAccountName}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowWithdrawConfirm(false)}
                                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3.5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-[0.98]"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={async () => {
                                        setShowWithdrawConfirm(false);
                                        await handleWithdraw(totalEarnings);
                                        setWalletView('history');
                                    }}
                                    disabled={isSavingWalletProfile}
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3.5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-[0.98] shadow-lg shadow-green-200 disabled:opacity-50"
                                >
                                    {isSavingWalletProfile ? 'Memproses...' : 'Konfirmasi'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {isSubmitting && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-orange-500"></div>
                    <p className="ml-4 text-white text-lg font-bold">Memproses...</p>
                </div>
            )}

            {/* SIDEBAR DESKTOP */}
            {(isAdmin || isOwner || isAgent) && renderSidebar()}


            {/* MAIN CONTENT AREA */}
            <div className={`flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto ${isAgent ? 'pb-24' : ''}`}>
                <div className="max-w-7xl mx-auto">
                    
                    {/* VIEW MODE TOGGLE (Admin Only) */}
                    {isAdmin && (
                        <div className="flex justify-between items-center mb-8 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
                            <div className="flex bg-gray-100 p-1 rounded-xl">
                                <button 
                                    onClick={() => setDashboardViewMode('global')}
                                    className={`px-4 sm:px-6 py-2 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all ${dashboardViewMode === 'global' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    🌐 Global View
                                </button>
                                <button 
                                    onClick={() => setDashboardViewMode('personal')}
                                    className={`px-4 sm:px-6 py-2 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all ${dashboardViewMode === 'personal' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    👤 My Properties
                                </button>
                            </div>
                            <div className="hidden md:flex items-center gap-3 px-4">
                                <div className={`w-2 h-2 rounded-full ${dashboardViewMode === 'global' ? 'bg-green-500 animate-pulse' : 'bg-orange-500'}`}></div>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    {dashboardViewMode === 'global' ? 'System-wide monitoring' : 'Isolated Property View'}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* MOBILE MENU DROPDOWN (if no sidebar) - Hidden for Agent because they have Bottom Nav */}
                    {(isAdmin || isOwner) && !isAgent && (
                        <div className="md:hidden w-full mb-6 relative z-20">
                            <select
                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-widest focus:ring-2 focus:ring-orange-500/20"
                                value={activeMenu}
                                onChange={(e) => handleMenuChange(e.target.value as DashboardMenu)}
                            >
                                <option value="analytics">📊 Ringkasan Analisis</option>
                                <option value="properties">🏠 Kelola Kost</option>
                                {isAdmin && <option value="databases">🗄️ Kelola Database</option>}
                                {isAdmin && <option value="verification">⚙️ Katalog Verifikasi</option>}
                                <option value="transactions_rent">🛒 Sewa Kost</option>
                                {isAdmin && <option value="transactions_db">📦 Pembelian DB</option>}
                                {isAdmin && <option value="verifikasi">✅ Jasa Survey</option>}
                                {isAdmin && <option value="mitra">🤝 Pendaftar Mitra</option>}
                                <option value="complaints">🛠️ Komplain</option>
                            </select>
                        </div>
                    )}

                    {/* LOADING STATE */}
                    {loading ? (
                        <div className="text-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div></div>
                    ) : (
                        <>
                            {/* AGENT VIEW: Full screen experience */}
                            {isAgent ? (
                                <AgentDashboard 
                                    uid={uid || ''}
                                    user={user}
                                    verificationStatus={verificationStatus}
                                    surveyRequests={surveyRequests}
                                    loadSurveyRequests={loadSurveyRequests}
                                    activeMenu={activeMenu as any}
                                    onMenuChange={handleMenuChange as any}
                                />
                            ) : (
                                <div className="admin-content-area">
                                    {activeMenu === 'analytics' && (isAdmin || isOwner) && (
                                        <AnalyticsView
                                            analyticsSummary={analyticsSummary}
                                            dateFilter={dateFilter}
                                            setDateFilter={setDateFilter}
                                            customStartDate={customStartDate}
                                            setCustomStartDate={setCustomStartDate}
                                            customEndDate={customEndDate}
                                            setCustomEndDate={setCustomEndDate}
                                            selectedYear={selectedYear}
                                            setSelectedYear={setSelectedYear}
                                            dashboardViewMode={dashboardViewMode}
                                            setDashboardViewMode={setDashboardViewMode}
                                            currentYear={currentYear}
                                            getMaxEndDate={getMaxEndDate}
                                        />
                                    )}
                                    
                                    {activeMenu === 'properties' && (
                                        <>
                                            <div className="flex justify-end mb-4">
                                                <button
                                                    onClick={openAddModal}
                                                    className="bg-orange-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-orange-600 transition-all shadow-lg active:scale-95 flex items-center gap-2"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                                    Tambah Kost
                                                </button>
                                            </div>
                                            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-left text-sm text-gray-500">
                                                        <thead className="bg-gray-50/50 text-xs font-black text-gray-500 uppercase tracking-widest">
                                                            <tr>
                                                                <th className="px-6 py-4">Info Kost</th>
                                                                <th className="px-6 py-4">Lokasi</th>
                                                                <th className="px-6 py-4">Pemilik</th>
                                                                <th className="px-6 py-4">Harga /Bulan</th>
                                                                <th className="px-6 py-4">Status</th>
                                                                <th className="px-6 py-4 text-right">Aksi</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-50">
                                                            {displayListings.map(item => (
                                                                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                                                    <td className="px-6 py-4">
                                                                        <div className="flex items-center gap-3">
                                                                            <img
                                                                                src={item.imageUrls?.[0] || 'https://via.placeholder.com/100'}
                                                                                alt={item.title}
                                                                                className="w-12 h-12 rounded-lg object-cover bg-gray-100"
                                                                            />
                                                                            <div>
                                                                                <p className="font-bold text-gray-900">{item.title}</p>
                                                                                <p className="text-xs text-gray-400 mt-0.5">{item.type}</p>
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-6 py-4">
                                                                        <p className="font-medium text-gray-900">{item.city}</p>
                                                                        <p className="text-xs text-gray-400 mt-0.5">{item.area}</p>
                                                                    </td>
                                                                    <td className="px-6 py-4">
                                                                        <div className="flex flex-col">
                                                                            <p className="font-bold text-gray-900">{item.ownerName || 'Admin'}</p>
                                                                            {item.ownerRole && ['owner', 'mitra'].includes(item.ownerRole.toLowerCase()) && (
                                                                                <span className="inline-flex mt-1 text-[8px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded w-fit border border-emerald-100">Mitra Dashboard</span>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-6 py-4 font-bold text-gray-900">
                                                                        {FORMAT_CURRENCY(item.price)}
                                                                    </td>
                                                                    <td className="px-6 py-4">
                                                                        <span className={`inline-flex px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md ${item.status === 'published' ? 'bg-green-100 text-green-700' :
                                                                            item.status === 'draft' ? 'bg-gray-100 text-gray-600' : 'bg-orange-100 text-orange-700'
                                                                            }`}>
                                                                            {item.status || 'Active'}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-6 py-4">
                                                                        <div className="flex justify-end gap-2">
                                                                            <button onClick={() => window.open(`/kost/${item.id}`, '_blank')} className="px-3 py-1.5 rounded-lg text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors">Kunjungi</button>
                                                                            {isAdmin && (
                                                                                <button onClick={() => handleOpenTransferModal('property', item)} className="px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-colors">Transfer</button>
                                                                            )}
                                                                            <button onClick={() => openEditModal(item)} className="px-3 py-1.5 rounded-lg text-xs font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 transition-colors">Edit</button>
                                                                            <button onClick={() => handleDelete(item.id, 'kost', item.title)} className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors">Hapus</button>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                            {displayListings.length === 0 && (
                                                                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400 font-medium">Belum ada data kost.</td></tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {activeMenu === 'verification' && isAdmin && (
                                        <CatalogManagement 
                                            verifikasiPrice={verifikasiPrice}
                                            setVerifikasiPrice={setVerifikasiPrice}
                                            verifikasiDiscount={verifikasiDiscount}
                                            setVerifikasiDiscount={setVerifikasiDiscount}
                                            verifikasiDescription={verifikasiDescription}
                                            setVerifikasiDescription={setVerifikasiDescription}
                                            isSavingVerifikasi={isSavingVerifikasi}
                                            setIsSavingVerifikasi={setIsSavingVerifikasi}
                                            dbProducts={[]} // Not used for verification tab
                                            loadDatabases={() => {}}
                                            FORMAT_CURRENCY={FORMAT_CURRENCY}
                                            setActiveMenu={setActiveMenu}
                                            activeTab="verification"
                                        />
                                    )}
                                    {activeMenu === 'transactions_rent' && (
                                        <RentTransactionManagement 
                                            isAdmin={isAdmin}
                                            uid={uid}
                                            rentTransactions={rentTransactions}
                                            refreshData={loadRentTransactions}
                                        />
                                    )}

                                    {activeMenu === 'transactions_db' && (
                                        <DbTransactionManagement 
                                            isAdmin={isAdmin}
                                            dbTransactions={dbTransactions}
                                            refreshData={loadDbTransactions}
                                        />
                                    )}

                                    {activeMenu === 'databases' && isAdmin && (
                                        <CatalogManagement 
                                            activeTab="database"
                                            dbProducts={dbProducts}
                                            loadDatabases={loadDatabases}
                                            FORMAT_CURRENCY={FORMAT_CURRENCY}
                                            setActiveMenu={setActiveMenu}
                                            verifikasiPrice={0} // Not used for DB tab
                                            setVerifikasiPrice={() => {}} 
                                            verifikasiDiscount={0}
                                            setVerifikasiDiscount={() => {}}
                                            verifikasiDescription=""
                                            setVerifikasiDescription={() => {}}
                                            isSavingVerifikasi={false}
                                            setIsSavingVerifikasi={() => {}}
                                        />
                                    )}

                                    {activeMenu === 'verifikasi' && isAdmin && (
                                        <SurveyManagement
                                            isAdmin={isAdmin}
                                            isAgent={isAgent}
                                            surveyRequests={surveyRequests}
                                            surveyAgents={surveyAgents}
                                            refreshData={loadSurveyRequests}
                                        />
                                    )}
                                    {activeMenu === 'mitra' && isAdmin && (
                                        <MitraManagement
                                            mitraRequests={mitraRequests}
                                            activeMitra={activeMitra}
                                            loadMitraRequests={loadMitraRequests}
                                            loadActiveMitra={loadActiveMitra}
                                            loading={loading}
                                            onTransferProperty={(mitra) => handleOpenTransferModal('mitra', mitra)}
                                            onBlockUser={handleBlockUser}
                                            onDeleteUser={handleDeleteUser}
                                            onViewProfile={handleViewProfile}
                                        />
                                    )}
                                     {activeMenu === 'agent_verification' && isAdmin && (
                                         <AgentManagement 
                                             agentVerifications={agentVerifications}
                                             surveyAgents={surveyAgents}
                                             loadAgentVerifications={loadAgentVerifications}
                                             loadActiveAgents={loadActiveAgents}
                                             loading={loading}
                                             onBlockUser={handleBlockUser}
                                             onDeleteUser={handleDeleteUser}
                                             onViewProfile={handleViewProfile}
                                         />
                                     )}
                                    {activeMenu === 'tenants' && isAdmin && (
                                        <UserManagement
                                            activeUsers={activeUsers}
                                            loadActiveUsers={loadActiveUsers}
                                            loading={loading}
                                            onBlockUser={handleBlockUser}
                                            onDeleteUser={handleDeleteUser}
                                            onViewProfile={handleViewProfile}
                                        />
                                    )}
                                    {activeMenu === 'banners' && isAdmin && (
                                        <BannerManagement
                                            banners={banners}
                                            refreshData={loadBanners}
                                        />
                                    )}
                                    {activeMenu === 'complaints' && (isAdmin || isOwner) && (
                                        <ComplaintManagement 
                                            complaints={complaints}
                                            refreshData={loadComplaints}
                                        />
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* MODAL PROPERTY FORM */}
                {isModalOpen && activeMenu === 'properties' && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 overflow-hidden">

                        <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                        <div className="bg-white w-full h-full sm:h-auto sm:max-w-6xl sm:max-h-[90vh] sm:rounded-[2.5rem] shadow-2xl relative flex flex-col overflow-hidden animate-in zoom-in-95">

                            {/* Header */}
                            <div className="p-6 sm:p-8 border-b border-gray-100 flex justify-between items-center bg-white z-20">
                                <h2 className="text-xl sm:text-2xl font-black text-gray-900 uppercase tracking-tight">{editingId ? 'Edit Properti' : 'Tambah Properti Baru'}</h2>
                                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>

                            {/* Content Body - Split View */}
                            <div className="flex flex-col md:flex-row flex-grow overflow-hidden relative">

                                {/* Desktop Sidebar Navigation */}
                                <div className="hidden md:flex flex-col w-72 bg-gray-50 border-r border-gray-100 overflow-y-auto shrink-0">
                                    <div className="p-4 space-y-1">
                                        {sections.map(tab => (
                                            <button
                                                key={tab.id}
                                                type="button"
                                                onClick={() => setActiveTab(tab.id)}
                                                className={`w-full text-left px-6 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab.id
                                                    ? 'bg-white text-orange-600 shadow-sm border border-gray-100'
                                                    : 'text-gray-400 hover:bg-white/50 hover:text-gray-600'
                                                    }`}
                                            >
                                                {tab.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Form Area */}
                                <div className="flex-1 overflow-y-auto bg-white relative">
                                    <form onSubmit={handleSubmit} className="min-h-full flex flex-col">

                                        {/* Mobile Accordion & Desktop Content Wrapper */}
                                        <div className="flex-grow p-6 sm:p-10 space-y-4">
                                            {sections.map(section => (
                                                <div key={section.id} className="md:hidden border border-gray-100 rounded-2xl overflow-hidden">
                                                    {/* Mobile Header Toggle */}
                                                    <button
                                                        type="button"
                                                        onClick={() => setActiveTab(activeTab === section.id ? '' : section.id)}
                                                        className={`w-full flex items-center justify-between p-5 text-left transition-colors ${activeTab === section.id ? 'bg-orange-50 text-orange-600' : 'bg-white text-gray-700'
                                                            }`}
                                                    >
                                                        <span className="text-xs font-black uppercase tracking-widest">{section.label}</span>
                                                        <svg className={`w-4 h-4 transition-transform ${activeTab === section.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                                    </button>

                                                    {/* Mobile Content */}
                                                    <div className={`${activeTab === section.id ? 'block' : 'hidden'} border-t border-gray-100 bg-white p-5`}>
                                                        {renderSectionContent(section.id)}
                                                    </div>
                                                </div>
                                            ))}

                                            {/* Desktop Visible Content */}
                                            <div className="hidden md:block">
                                                {renderSectionContent(activeTab)}
                                            </div>
                                        </div>

                                        {/* Sticky Footer */}
                                        <div className="p-6 sm:p-8 border-t border-gray-100 bg-white/95 backdrop-blur-sm sticky bottom-0 z-10 flex justify-between gap-4 mt-auto">
                                            {editingId && (
                                                <button type="button" onClick={handleDeleteFromModal} className="px-6 py-3 rounded-xl font-bold text-red-500 hover:bg-red-50 transition-colors">
                                                    Hapus Properti
                                                </button>
                                            )}
                                            <div className="flex gap-4 ml-auto">
                                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition-colors">Batal</button>
                                                <button type="submit" disabled={isSubmitting} className="px-8 py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-colors shadow-lg shadow-orange-100 active:scale-95">
                                                    {isSubmitting ? 'Menyimpan...' : 'Simpan Properti'}
                                                </button>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                )}




                {/* CUSTOM CONFIRM DELETE MODAL */}
                {showConfirmDeleteModal && itemToDelete && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm" onClick={cancelDeleteItem}></div>
                        <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl p-6 relative z-10 animate-in zoom-in-95">
                            <h3 className="text-xl font-black text-gray-900 mb-4">Konfirmasi Penghapusan</h3>
                            <p className="text-gray-700 mb-6">
                                Anda yakin ingin menghapus {itemToDelete.type === 'kost' ? 'properti' : 'database'}{" "}
                                <span className="font-bold">"{itemToDelete.name}"</span> ini secara permanen?
                                Data yang dihapus tidak dapat dikembalikan.
                            </p>
                            <div className="flex justify-end gap-3">
                                <button onClick={cancelDeleteItem} className="px-5 py-2 rounded-lg font-bold text-gray-500 hover:bg-gray-50 transition-colors">Batal</button>
                                <button onClick={confirmDeleteItem} className="px-5 py-2 rounded-lg font-bold text-white bg-red-600 hover:bg-red-700 transition-colors">Hapus Sekarang</button>
                            </div>
                        </div>
                    </div>
                )}




                {/* MODAL: MANUAL MAP PICKER FOR FACILITIES */}
                {activeMapPicker && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm" onClick={() => setActiveMapPicker(null)}></div>
                        <div className="bg-white max-w-lg w-full rounded-3xl overflow-hidden shadow-2xl relative z-10 animate-in zoom-in-95 duration-300 flex flex-col">
                            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <div>
                                    <h3 className="font-black text-gray-900 uppercase tracking-tight">Pilih Titik di Peta</h3>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Geser peta untuk memilih lokasi presisi</p>
                                </div>
                                <button type="button" onClick={() => setActiveMapPicker(null)} className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-xl text-gray-400 hover:text-red-500 transition-colors">&times;</button>
                            </div>
                            <div className="relative h-[400px] w-full">
                                <LocationPicker
                                    lat={
                                        (formData[activeMapPicker.field] || [])[activeMapPicker.index]?.lat 
                                        || formData.location?.lat 
                                        || -6.2088
                                    }
                                    lng={
                                        (formData[activeMapPicker.field] || [])[activeMapPicker.index]?.lng 
                                        || formData.location?.lng 
                                        || 106.8456
                                    }
                                    onLocationChange={(lat, lng) => {
                                        // We temporarily store the picked value here if we want to save it on manual map save click
                                        // Or we can auto save. We'd better just save the activeMapLocation in a temp state to confirm.
                                        // But LocationPicker is stateful enough. Wait, actually we don't have a ref.
                                        // Let's create an inline wrapper component to handle the confirm, or just save immediately on pan.
                                        // Saving immediately is easier:
                                        handleMapPickerSave(lat, lng);
                                    }}
                                />
                            </div>
                            <div className="p-4 bg-orange-50 border-t border-orange-100 flex justify-end">
                              <p className="text-[10px] text-orange-600 font-bold italic">Lokasi otomatis disimpan saat penanda digeser.</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* MODAL: TRANSFER PROPERTI */}
                {isTransferModalOpen && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm shadow-2xl" onClick={() => setIsTransferModalOpen(false)}></div>
                        <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl relative z-10 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300">
                            {/* Header */}
                            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 sticky top-0 z-10">
                                <div className="pr-4">
                                    <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight leading-none">
                                        {transferMode === 'property' ? 'Transfer Properti' : 'Pilih Properti'}
                                    </h3>
                                    <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mt-2 leading-none">
                                        {transferMode === 'property' 
                                            ? `Properti: ${selectedTransferItem?.title}` 
                                            : `Penerima: ${selectedTransferItem?.name || selectedTransferItem?.display_name}`}
                                    </p>
                                </div>
                                <button onClick={() => setIsTransferModalOpen(false)} className="w-10 h-10 flex items-center justify-center bg-white border border-gray-200 rounded-xl text-gray-400 hover:text-red-500 transition-all active:scale-95 shadow-sm">&times;</button>
                            </div>

                            {/* Search */}
                            <div className="p-6 border-b border-gray-100 bg-white sticky top-[89px] z-10">
                                <div className="relative group">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors">🔍</span>
                                    <input 
                                        type="text" 
                                        placeholder={transferMode === 'property' ? "Cari Mitra penerima..." : "Cari properti Anda..."}
                                        className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-transparent rounded-[1.25rem] text-sm font-bold outline-none focus:bg-white focus:border-orange-500/30 focus:ring-4 focus:ring-orange-500/5 transition-all"
                                        value={transferSearchQuery}
                                        onChange={(e) => setTransferSearchQuery(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                            </div>

                            {/* List Content */}
                            <div className="flex-grow overflow-y-auto p-4 space-y-2 bg-gray-50/30">
                                {loading && (transferMode === 'property' ? activeMitra : adminListings).length === 0 ? (
                                    <div className="py-20 text-center">
                                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500 mx-auto"></div>
                                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-4">Memuat Data...</p>
                                    </div>
                                ) : (
                                    <>
                                        {transferMode === 'property' ? (
                                            // Flow 1: Pilih Properti -> Pilih Mitra
                                            (() => {
                                                const searchLower = transferSearchQuery.toLowerCase();
                                                const filteredMitra = activeMitra.filter(m => 
                                                    m.id !== selectedTransferItem?.ownerUid && 
                                                    ((m.name || '').toLowerCase().includes(searchLower) || (m.email || '').toLowerCase().includes(searchLower))
                                                );

                                                // Inject Super Admin (Self) if it matches search and isn't already the owner
                                                const showSuperAdminSelf = isAdmin && 
                                                    selectedTransferItem?.ownerUid !== uid && 
                                                    ("super admin (saya)".includes(searchLower) || "admin".includes(searchLower));

                                                const listToShow = showSuperAdminSelf 
                                                    ? [{ id: uid, name: 'Super Admin (Saya)', email: user?.email || 'admin@system', isSelf: true }, ...filteredMitra]
                                                    : filteredMitra;

                                                return listToShow.length > 0 ? (
                                                    listToShow.map(mitra => (
                                                        <button 
                                                            key={mitra.id}
                                                            onClick={() => handleConfirmTransfer(selectedTransferItem.id, mitra.id)}
                                                            className={`w-full flex items-center gap-4 p-4 rounded-3xl transition-all border text-left group shadow-sm hover:shadow-md ${
                                                                (mitra as any).isSelf 
                                                                    ? 'bg-orange-50 border-orange-200 hover:bg-orange-100' 
                                                                    : 'bg-white border-transparent hover:border-orange-100'
                                                            }`}
                                                        >
                                                            <div className={`w-11 h-11 rounded-full flex items-center justify-center text-xl overflow-hidden shrink-0 border-2 border-white shadow-sm ring-4 transition-all ${
                                                                (mitra as any).isSelf ? 'bg-orange-600 ring-orange-100' : 'bg-emerald-100 ring-gray-50 group-hover:ring-orange-100/50'
                                                            }`}>
                                                                {(mitra as any).isSelf ? <span className="text-white text-sm font-black">SA</span> : (mitra.photo_url ? <img src={mitra.photo_url} className="w-full h-full object-cover" /> : <span>👤</span>)}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-bold text-gray-900 truncate text-[13px]">{mitra.name || mitra.display_name}</p>
                                                                <p className="text-[10px] text-gray-400 font-bold uppercase truncate tracking-tight">{mitra.email}</p>
                                                            </div>
                                                            <div className="opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                                                                <span className="text-[9px] font-black text-white bg-orange-600 px-3 py-1.5 rounded-full uppercase shadow-lg shadow-orange-200">
                                                                    {(mitra as any).isSelf ? 'Akuisisi' : 'Pilih'}
                                                                </span>
                                                            </div>
                                                        </button>
                                                    ))
                                                ) : (
                                                    <div className="py-20 text-center space-y-4">
                                                        <div className="text-4xl grayscale opacity-50">🔎</div>
                                                        <div className="text-gray-400 font-black uppercase text-[10px] tracking-[0.2em]">Mitra Tidak Ditemukan</div>
                                                    </div>
                                                );
                                            })()
                                        ) : (
                                            // Flow 2: Pilih Mitra -> Pilih Properti Super Admin
                                            adminListings.filter(p => 
                                                (p.ownerUid === uid || p.ownerUid?.toLowerCase() === 'admin-system-id') && // Properti milik admin/sistem
                                                (p.title.toLowerCase().includes(transferSearchQuery.toLowerCase()) || (p.city || '').toLowerCase().includes(transferSearchQuery.toLowerCase()))
                                            ).length > 0 ? (
                                                adminListings.filter(p => 
                                                    (p.ownerUid === uid || p.ownerUid?.toLowerCase() === 'admin-system-id') && 
                                                    (p.title.toLowerCase().includes(transferSearchQuery.toLowerCase()) || (p.city || '').toLowerCase().includes(transferSearchQuery.toLowerCase()))
                                                ).map(prop => (
                                                    <button 
                                                        key={prop.id}
                                                        onClick={() => handleConfirmTransfer(prop.id, selectedTransferItem.id)}
                                                        className="w-full flex items-center gap-4 p-4 rounded-3xl bg-white hover:bg-orange-50 transition-all border border-transparent hover:border-orange-100 text-left group shadow-sm hover:shadow-md"
                                                    >
                                                        <div className="w-14 h-14 rounded-2xl bg-gray-100 overflow-hidden shrink-0 border-2 border-white shadow-sm ring-4 ring-gray-50 group-hover:ring-orange-100/50 transition-all">
                                                            <img src={prop.imageUrls?.[0] || 'https://via.placeholder.com/100'} className="w-full h-full object-cover" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-bold text-gray-900 truncate text-[13px]">{prop.title}</p>
                                                            <p className="text-[10px] text-gray-400 font-bold uppercase truncate tracking-tight">{prop.city}, {prop.area}</p>
                                                        </div>
                                                        <div className="opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                                                            <span className="text-[9px] font-black text-white bg-orange-600 px-3 py-1.5 rounded-full uppercase shadow-lg shadow-orange-200">Transfer</span>
                                                        </div>
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="py-20 text-center space-y-4">
                                                    <div className="text-4xl grayscale opacity-50">🔎</div>
                                                    <div className="text-gray-400 font-black uppercase text-[10px] tracking-[0.2em]">Properti Tidak Ditemukan</div>
                                                </div>
                                            )
                                        )}
                                    </>
                                )}
                            </div>
                            
                            {/* Footer Hint */}
                            <div className="p-4 bg-orange-50/50 border-t border-orange-100 border-dashed">
                                <p className="text-[9px] text-orange-700 font-bold leading-relaxed text-center italic">
                                    * Tindakan ini akan memindahkan akses pengelolaan properti secara permanen ke akun Mitra tujuan.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* MODAL: DETAIL USER LENGKAP */}
            {isUserDetailModalOpen && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm" onClick={() => setIsUserDetailModalOpen(false)}></div>
                    <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl relative z-10 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300">
                        {/* Header */}
                        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight leading-none">Profil Lengkap User</h3>
                                <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mt-2 leading-none">Informasi Administratif platform</p>
                            </div>
                            <button onClick={() => setIsUserDetailModalOpen(false)} className="w-10 h-10 flex items-center justify-center bg-white border border-gray-200 rounded-xl text-gray-400 hover:text-red-500 transition-all active:scale-95 shadow-sm">&times;</button>
                        </div>

                        {/* Content */}
                        <div className="flex-grow overflow-y-auto p-8">
                            {isLoadingUserDetail ? (
                                <div className="py-20 text-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500 mx-auto"></div></div>
                            ) : selectedUserForDetail && (
                                <div className="space-y-8">
                                    <div className="flex items-center gap-6">
                                        <div className="w-24 h-24 rounded-full bg-orange-100 flex items-center justify-center text-3xl overflow-hidden border-4 border-white shadow-lg ring-1 ring-gray-100">
                                            {selectedUserForDetail.photo_url ? <img src={selectedUserForDetail.photo_url} className="w-full h-full object-cover" /> : <span>👤</span>}
                                        </div>
                                        <div>
                                            <h4 className="text-2xl font-black text-gray-900">{selectedUserForDetail.name || selectedUserForDetail.display_name}</h4>
                                            <span className={`inline-flex px-3 py-1 mt-2 text-[10px] font-black uppercase tracking-widest rounded-full border ${
                                                selectedUserForDetail.status === 'blocked' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'
                                            }`}>
                                                Status: {selectedUserForDetail.status || 'active'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <DetailItem label="User ID" value={selectedUserForDetail.id} />
                                        <DetailItem label="Role Sistem" value={selectedUserForDetail.role || 'user'} isOrange />
                                        <DetailItem label="Email" value={selectedUserForDetail.email || '-'} />
                                        <DetailItem label="Nomor Telepon" value={selectedUserForDetail.phone || '-'} />
                                        <DetailItem label="Terdaftar Sejak" value={new Date(selectedUserForDetail.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} />
                                        <DetailItem label="NIK / KTP" value={selectedUserForDetail.ktp_number || 'Belum Terverifikasi'} />
                                    </div>

                                    {/* Additional context based on role */}
                                    {selectedUserForDetail.properties?.length > 0 && (
                                        <div className="pt-6 border-t border-gray-100">
                                            <h5 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Daftar Properti ({selectedUserForDetail.properties.length})</h5>
                                            <div className="space-y-2">
                                                {selectedUserForDetail.properties.map((p: any) => (
                                                    <div key={p.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                                        <span className="font-bold text-gray-900">{p.title}</span>
                                                        <span className="text-[10px] font-black uppercase text-gray-400">{p.city} • {p.status}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {selectedUserForDetail.surveysCount !== undefined && selectedUserForDetail.surveysCount > 0 && (
                                        <div className="pt-6 border-t border-gray-100">
                                            <h5 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Statistik Agen</h5>
                                            <div className="p-5 bg-orange-50 rounded-3xl border border-orange-100">
                                                <p className="text-sm font-bold text-orange-900">Total Survey Selesai: <span className="text-lg font-black">{selectedUserForDetail.surveysCount}</span></p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const DetailItem = ({ label, value, isOrange }: { label: string, value: string, isOrange?: boolean }) => (
    <div className="space-y-1.5">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
        <p className={`font-bold text-sm ${isOrange ? 'text-orange-600' : 'text-gray-900'} break-all`}>{value}</p>
    </div>
);

export default Dashboard;
