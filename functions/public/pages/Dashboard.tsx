
import React, { useState, useEffect, useRef } from 'react';
import { Kost, RoomType, RoomPricing, PricingPeriod, DatabaseProduct, Page, SurveyRequest } from '../types';
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
    uploadSurveyPhoto, deleteSurveyPhoto
} from '../adminService';
import AgentDashboard from './AgentDashboard';
import { getUserTransactions } from '../userService';
import { sendNotification } from '../notificationService';
import Listings from './Listings';

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
const LocationPicker: React.FC<{ lat: number; lng: number; onLocationChange: (lat: number, lng: number, address: string) => void }> = ({ lat, lng, onLocationChange }) => {
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
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
                    headers: {
                        'User-Agent': 'RuangSinggah/1.0'
                    }
                });
                const data = await response.json();
                const address = data.display_name || "Alamat tidak ditemukan";
                onLocationChange(lat, lng, address);
                setSearchQuery(address);
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

type DashboardMenu = 'analytics' | 'overview' | 'properties' | 'databases' | 'transactions_rent' | 'transactions_db' | 'mitra' | 'verification' | 'complaints' | 'verifikasi' | 'my_surveys' | 'agent_wallet' | 'tenants' | 'agent_verification';

const Dashboard: React.FC<DashboardProps> = ({ role, uid, user, onPageChange, listings = [], onAdd, onEdit, onDelete, onRefreshListings, verificationStatus }) => {
    const isAdmin = role === 'admin';
    const isAgent = role === 'survey_agent';
    const isOwner = role === 'owner';

    const [activeMenu, setActiveMenu] = useState<DashboardMenu>(
        isAgent ? 'overview' : (isOwner ? 'properties' : 'analytics')
    );
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
    // --- AKHIR STATE BARU ---

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

    // PROPERTIES STATE
    const [adminListings, setAdminListings] = useState<BasicPropertyInfo[]>([]);
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<string>('info');
    const [mapAddress, setMapAddress] = useState<string>("");


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
                const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(text)}&limit=5`, {
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

    // DATABASES STATE
    const [dbProducts, setDbProducts] = useState<DatabaseProduct[]>([]);
    const [analyticsSummary, setAnalyticsSummary] = useState<AnalyticsSummary | null>(null);

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
    const [isDbModalOpen, setIsDbModalOpen] = useState(false);
    const [editingDbId, setEditingDbId] = useState<string | null>(null);
    const initialDbForm: any = { campus: '', city: '', area: '', description: '', price: 0, totalData: 0, fileType: 'link', fileUrl: '' };
    const [dbForm, setDbForm] = useState<Partial<DatabaseProduct>>(initialDbForm);
    const [dbCoverFile, setDbCoverFile] = useState<File | null>(null);
    const [dbDocFile, setDbDocFile] = useState<File | null>(null);

    // VERIFIKASI KOST STATE (Catalog)
    const [verifikasiPrice, setVerifikasiPrice] = useState<number>(70000);
    const [verifikasiDiscount, setVerifikasiDiscount] = useState<number>(0);
    const [verifikasiDescription, setVerifikasiDescription] = useState<string>("Layanan Cek Lokasi Langsung secara live videocall dengan dokumentasi lengkap dan jujur. Sangat cocok bagi Anda yang berada di luar kota dan ingin memastikan kondisi kost yang sebenarnya sebelum melakukan booking.");
    const [isSavingVerifikasi, setIsSavingVerifikasi] = useState<boolean>(false);

    // RENT TRANSACTION MODALS
    const [viewingProof, setViewingProof] = useState<{ id: string, name: string, proofUrl: string } | null>(null);
    const [viewingInvoice, setViewingInvoice] = useState<any | null>(null);
    const [viewingProfile, setViewingProfile] = useState<any | null>(null);

    // DB ORDER MODALS
    const [viewingDbProof, setViewingDbProof] = useState<{ id: string, name: string, proofUrl: string } | null>(null);
    const [viewingDbInvoice, setViewingDbInvoice] = useState<any | null>(null);
    const [viewingDbProfile, setViewingDbProfile] = useState<any | null>(null);

    // VERIFIKASI KOST MODALS
    const [viewingVerifProof, setViewingVerifProof] = useState<{ id: string, name: string, proofUrl: string } | null>(null);
    const [viewingVerifInvoice, setViewingVerifInvoice] = useState<any | null>(null);
    const [viewingVerifProfile, setViewingVerifProfile] = useState<any | null>(null);

    // Temporary state for adding tags inside room types
    const [tempTagInput, setTempTagInput] = useState<{ [key: string]: string }>({});

    // --- RENT TRANSACTION FILTER ---
    const [rentFilter, setRentFilter] = useState<'all' | 'pengajuan' | 'realisasi' | 'perpanjangan'>('all');


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

    // COMPLAINTS STATE
    const [complaints, setComplaints] = useState<any[]>([]);

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

    // --- AGENT VERIFICATIONS STATE ---
    const [agentVerifications, setAgentVerifications] = useState<any[]>([]);

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

    // --- SURVEY REQUESTS STATE ---
    const [surveyRequests, setSurveyRequests] = useState<SurveyRequest[]>([]);
    const [adminSurveyTab, setAdminSurveyTab] = useState<'all' | 'pending' | 'active' | 'completed'>('all');
    const [surveyAgents, setSurveyAgents] = useState<{id: string, name: string, phone: string, photo_url?: string, rating?: string}[]>([]);
    const [isEditingSurvey, setIsEditingSurvey] = useState<SurveyRequest | null>(null);
    const [isReschedulingSurvey, setIsReschedulingSurvey] = useState<SurveyRequest | null>(null);
    const [newSurveyDate, setNewSurveyDate] = useState('');
    const [newSurveyTime, setNewSurveyTime] = useState('');
    const [userRating, setUserRating] = useState<number>(0);
    const [userComment, setUserComment] = useState('');
    const [isUploadingSurveyPhoto, setIsUploadingSurveyPhoto] = useState<string | null>(null);
    const [surveyForm, setSurveyForm] = useState<Partial<SurveyRequest>>({});

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

    const handleDeleteSurvey = async (id: string, name: string) => {
        if (!window.confirm(`Apakah Anda yakin ingin menghapus permohonan survey "${name}"? Data yang dihapus tidak dapat dikembalikan.`)) return;
        setIsSubmitting(true);
        try {
            await deleteSurveyRequest(id);
            alert('Survey berhasil dihapus');
            loadSurveyRequests();
        } catch (error) {
            console.error("Gagal menghapus survey", error);
            alert('Gagal menghapus survey');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateSurvey = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isEditingSurvey) return;
        setIsSubmitting(true);
        try {
            const oldStatus = isEditingSurvey.status;
            const finalData = { ...surveyForm };
            
            // WHITELIST ONLY ACTUAL DATABASE COLUMNS
            // This prevents Supabase 400 error (Unknown Column) from relation fields like 'user' & 'transaction'
            const SURVEY_DB_COLUMNS = [
                'status', 'kost_name', 'kost_address', 'owner_phone', 
                'survey_date', 'survey_time', 'notes', 
                'agent_name', 'agent_phone', 'agent_photo_url', 'assigned_agent_id',
                'result_drive_link', 'evaluation_summary', 
                'user_rating', 'user_comment'
            ];

            const updates: any = {};
            SURVEY_DB_COLUMNS.forEach(col => {
                if (finalData.hasOwnProperty(col)) {
                    updates[col] = (finalData as any)[col];
                }
            });

            if (isAgent && updates.status === 'SURVEYING') {
                updates.status = 'COMPLETED';
            }

            await updateSurveyRequest(isEditingSurvey.id, updates);

            // Automated internal notifications via Service
            if (updates.status !== oldStatus) {
                await notifySurveyStatusUpdate(isEditingSurvey.id, updates.status);
            }

            alert('Survey berhasil diperbarui');
            loadSurveyRequests();
            setIsEditingSurvey(null);
        } catch (error) {
            console.error("Gagal update survey", error);
            alert('Gagal update survey');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRequestReschedule = async () => {
        if (!isReschedulingSurvey) return;
        setIsSubmitting(true);
        try {
            const updates = {
                survey_date: newSurveyDate,
                survey_time: newSurveyTime,
                notes: `(Reschedule Requested) ${isReschedulingSurvey.notes || ''}`.trim()
            };
            await updateSurveyRequest(isReschedulingSurvey.id, updates);
            
            // Notify User via WA
            const waText = `Halo ${isReschedulingSurvey.user?.name}, agen survey kami mengajukan perubahan jadwal survey untuk kost ${isReschedulingSurvey.kost_name} menjadi tanggal ${newSurveyDate} jam ${newSurveyTime}. Mohon konfirmasinya.`;
            window.open(`https://wa.me/${isReschedulingSurvey.user?.phone}?text=${encodeURIComponent(waText)}`, '_blank');
            
            alert('Permintaan Jadwal Ulang Terkirim');
            loadSurveyRequests();
            setIsReschedulingSurvey(null);
        } catch (error) {
            alert('Gagal mengirim permintaan jadwal ulang');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmitFeedback = async () => {
        if (!isEditingSurvey) return;
        setIsSubmitting(true);
        try {
            const updates = {
                user_rating: userRating,
                user_comment: userComment
            };
            await updateSurveyRequest(isEditingSurvey.id, updates);
            alert('Terima kasih atas feedback Anda!');
            loadSurveyRequests();
            setUserRating(0); // Close modal
            setUserComment('');
        } catch (error) {
            alert('Gagal menyimpan feedback');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGenerateDriveFolder = async () => {
        if (!isEditingSurvey) return;
        setIsSubmitting(true);
        try {
            const driveLink = await generateManualDriveFolder(isEditingSurvey.id);
            setSurveyForm(prev => ({ ...prev, result_drive_link: driveLink }));
            alert('Folder Drive berhasil dibuat!');
            loadSurveyRequests();
        } catch (error: any) {
            console.error("Gagal generate folder", error);
            alert(error.message || 'Gagal generate folder Drive');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateComplaintStatus = async (id: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from('complaints')
                .update({ status: newStatus })
                .eq('id', id);
                
            if (error) throw error;
            
            setComplaints((prev: any[]) => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
            alert('Status Komplain diperbarui ke ' + newStatus);
        } catch (e) {
            alert('Gagal mengupdate komplain');
        }
    };

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

    const handleBulkDeleteTransactions = async () => {
        if (selectedDbTrxIds.length === 0) return;
        if (!window.confirm(`Apakah Anda yakin ingin menghapus ${selectedDbTrxIds.length} transaksi terpilih? Data yang dihapus tidak dapat dikembalikan.`)) return;

        setLoading(true);
        try {
            await deleteTransactions(selectedDbTrxIds);
            alert(`${selectedDbTrxIds.length} transaksi berhasil dihapus`);
            loadDbTransactions();
        } catch (error: any) {
            alert('Gagal menghapus transaksi: ' + (error.message || 'Terjadi kesalahan'));
        } finally {
            setLoading(false);
        }
    };

    const handleBulkDeleteSurveys = async () => {
        if (selectedSurveyIds.length === 0) return;
        if (!window.confirm(`Apakah Anda yakin ingin menghapus ${selectedSurveyIds.length} permohonan survey terpilih? Data yang dihapus tidak dapat dikembalikan.`)) return;

        setIsSubmitting(true);
        try {
            await deleteSurveyRequests(selectedSurveyIds);
            alert(`${selectedSurveyIds.length} permohonan survey berhasil dihapus`);
            setSelectedSurveyIds([]);
            loadSurveyRequests();
        } catch (error: any) {
            console.error("Gagal menghapus survey massal", error);
            alert('Gagal menghapus survey massal: ' + (error.message || 'Terjadi kesalahan'));
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        if (activeMenu === 'properties') loadProperties();
        if (activeMenu === 'databases') loadDatabases();
        if (activeMenu === 'complaints') loadComplaints();
        if (activeMenu === 'transactions_db') loadDbTransactions();
        if (activeMenu === 'analytics' || activeMenu === 'overview') loadAnalyticsData();
        if (activeMenu === 'agent_verification') loadAgentVerifications();
        if (activeMenu === 'verifikasi' || activeMenu === 'my_surveys' || activeMenu === 'overview') loadSurveyRequests();
        if (activeMenu === 'agent_wallet') {
            loadSurveyRequests();
            loadAgentWalletProfile();
        }
    }, [isAdmin, activeMenu, dateFilter, customStartDate, customEndDate, dashboardViewMode]);

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

    const openEditDbModal = (dbItem: DatabaseProduct) => {
        setEditingDbId(dbItem.id);
        const fileUrls = dbItem.fileUrls || (dbItem as any).file_urls || {};
        const fileUrlValue = fileUrls.link || fileUrls.googleDrive || (dbItem as any).fileUrl || '';
        
        setDbForm({ ...dbItem, fileUrl: fileUrlValue });
        setDbCoverFile(null);
        setDbDocFile(null);
        setIsDbModalOpen(true);
    };

    const handleDbSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingDbId) {
                await updateDatabaseProduct(editingDbId, dbForm, dbCoverFile, dbDocFile);
            } else {
                if (dbForm.fileType === 'upload' && !dbDocFile) {
                    alert("Mohon upload file dokumen.");
                    setIsSubmitting(false);
                    return;
                }
                await addDatabaseProduct(dbForm, dbCoverFile, dbDocFile);
            }
            await loadDatabases();
            if (onRefreshListings) onRefreshListings(); // Refresh public listings
            setIsDbModalOpen(false);
            alert("Data database berhasil disimpan!");
        } catch (e) {
            console.error(e);
            alert("Gagal menyimpan data database.");
        } finally {
            setIsSubmitting(false);
        }
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
    const updateObjectArrayItem = (field: 'campuses' | 'publicFacilities', index: number, key: 'name' | 'distance' | 'transportMode', value: string) => {
        const arr = [...(formData[field] || [])];
        arr[index] = { ...arr[index], [key]: value };
        setFormData({ ...formData, [field]: arr });
    };
    const removeObjectArrayItem = (field: 'campuses' | 'publicFacilities', index: number) => {
        const arr = [...(formData[field] || [])];
        arr.splice(index, 1);
        setFormData({ ...formData, [field]: arr });
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
        const newRoom: RoomType = { name: 'New Room', size: '', price: 0, pricing: [{ period: 'bulanan', price: 0 }], features: [], roomFacilities: [], bathroomFacilities: [], isAvailable: true };
        setFormData({ ...formData, roomTypes: [...(formData.roomTypes || []), newRoom] });
    };
    const updateRoomType = (index: number, field: keyof RoomType, value: any) => {
        const rooms = [...(formData.roomTypes || [])];
        rooms[index] = { ...rooms[index], [field]: value };
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
                                    onLocationChange={(lat, lng, address) => {
                                        setFormData(prev => ({ ...prev, location: { lat, lng } }));
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
                                        <div className="flex gap-4 w-full items-center">
                                            <input
                                                type="text"
                                                value={campus.name}
                                                onChange={(e) => updateObjectArrayItem('campuses', idx, 'name', e.target.value)}
                                                className="w-1/2 bg-white border border-orange-200 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:border-orange-500"
                                                placeholder="Nama Kampus (Misal: IPB Dramaga)"
                                            />
                                            <input
                                                type="text"
                                                value={campus.distance}
                                                onChange={(e) => updateObjectArrayItem('campuses', idx, 'distance', e.target.value)}
                                                className="w-1/2 bg-white border border-orange-200 rounded-lg px-3 py-2 text-sm font-medium outline-none focus:border-orange-500"
                                                placeholder="Jarak Waktu (Misal: 5 Menit)"
                                            />
                                            <button type="button" onClick={() => removeObjectArrayItem('campuses', idx)} className="text-red-400 hover:text-red-600 bg-white p-2 border border-red-100 rounded-lg transition-colors shrink-0">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-orange-100">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Kendaraan:</span>
                                            <div className="flex gap-1">
                                                {['walk', 'motorcycle', 'car', 'transit'].map(mode => {
                                                    const icons: Record<string, React.ReactNode> = {
                                                        'walk': <svg className="w-5 h-5 text-current drop-shadow-sm" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 10a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z" /><path d="m7 21 3-8 1.5 3" /><path d="m16 21-2-6-1.5-3.5L9.5 10l-1.5 1.5" /><path d="M12 11.5 14 15l2-1.5" /></svg>,
                                                        'motorcycle': <svg className="w-5 h-5 text-current drop-shadow-sm" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M5 16A3 3 0 1 0 5 22A3 3 0 1 0 5 16Z" /><path d="M19 16A3 3 0 1 0 19 22A3 3 0 1 0 19 16Z" /><path d="M5 19H19" /><path d="M6 16L9.673 8.653A2 2 0 0 1 11.458 7.5H16" /><path d="M16 7.5L18.428 12.356A2 2 0 0 0 20.214 13.5H22" /><path d="M11.5 7.5L13.5 3H16" /></svg>,
                                                        'car': <svg className="w-5 h-5 text-current drop-shadow-sm" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" /><circle cx="7" cy="17" r="2" /><path d="M9 17h6" /><circle cx="17" cy="17" r="2" /></svg>,
                                                        'transit': <svg className="w-5 h-5 text-current drop-shadow-sm" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M8 6v6" /><path d="M15 6v6" /><path d="M2 12h19.6" /><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3" /><circle cx="7" cy="18" r="2" /><path d="M9 18h5" /><circle cx="16" cy="18" r="2" /></svg>
                                                    };
                                                    const isSelected = campus.transportMode === mode || (!campus.transportMode && mode === 'walk');
                                                    return (
                                                        <button
                                                            key={mode}
                                                            type="button"
                                                            onClick={() => updateObjectArrayItem('campuses', idx, 'transportMode', mode)}
                                                            className={`p-1.5 rounded-md transition-all ${isSelected ? 'bg-orange-500 text-white shadow-sm' : 'text-gray-400 hover:bg-gray-100'}`}
                                                            title={mode}
                                                        >
                                                            {icons[mode]}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
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
                                        <div className="flex gap-4 w-full items-center">
                                            <input
                                                type="text"
                                                value={fac.name}
                                                onChange={(e) => updateObjectArrayItem('publicFacilities', idx, 'name', e.target.value)}
                                                className="w-1/2 bg-white border border-blue-200 rounded-lg px-3 py-2 text-sm font-bold outline-none focus:border-blue-500"
                                                placeholder="Nama Tempat (Misal: Halte Busway)"
                                            />
                                            <input
                                                type="text"
                                                value={fac.distance}
                                                onChange={(e) => updateObjectArrayItem('publicFacilities', idx, 'distance', e.target.value)}
                                                className="w-1/2 bg-white border border-blue-200 rounded-lg px-3 py-2 text-sm font-medium outline-none focus:border-blue-500"
                                                placeholder="Jarak Waktu (Misal: 3 Menit)"
                                            />
                                            <button type="button" onClick={() => removeObjectArrayItem('publicFacilities', idx)} className="text-red-400 hover:text-red-600 bg-white p-2 border border-red-100 rounded-lg transition-colors shrink-0">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-blue-100">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Kendaraan:</span>
                                            <div className="flex gap-1">
                                                {['walk', 'motorcycle', 'car', 'transit'].map(mode => {
                                                    const icons: Record<string, React.ReactNode> = {
                                                        'walk': <svg className="w-5 h-5 text-current drop-shadow-sm" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 10a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z" /><path d="m7 21 3-8 1.5 3" /><path d="m16 21-2-6-1.5-3.5L9.5 10l-1.5 1.5" /><path d="M12 11.5 14 15l2-1.5" /></svg>,
                                                        'motorcycle': <svg className="w-5 h-5 text-current drop-shadow-sm" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M5 16A3 3 0 1 0 5 22A3 3 0 1 0 5 16Z" /><path d="M19 16A3 3 0 1 0 19 22A3 3 0 1 0 19 16Z" /><path d="M5 19H19" /><path d="M6 16L9.673 8.653A2 2 0 0 1 11.458 7.5H16" /><path d="M16 7.5L18.428 12.356A2 2 0 0 0 20.214 13.5H22" /><path d="M11.5 7.5L13.5 3H16" /></svg>,
                                                        'car': <svg className="w-5 h-5 text-current drop-shadow-sm" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" /><circle cx="7" cy="17" r="2" /><path d="M9 17h6" /><circle cx="17" cy="17" r="2" /></svg>,
                                                        'transit': <svg className="w-5 h-5 text-current drop-shadow-sm" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M8 6v6" /><path d="M15 6v6" /><path d="M2 12h19.6" /><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3" /><circle cx="7" cy="18" r="2" /><path d="M9 18h5" /><circle cx="16" cy="18" r="2" /></svg>
                                                    };
                                                    const isSelected = fac.transportMode === mode || (!fac.transportMode && mode === 'walk');
                                                    return (
                                                        <button
                                                            key={mode}
                                                            type="button"
                                                            onClick={() => updateObjectArrayItem('publicFacilities', idx, 'transportMode', mode)}
                                                            className={`p-1.5 rounded-md transition-all ${isSelected ? 'bg-blue-500 text-white shadow-sm' : 'text-gray-400 hover:bg-gray-100'}`}
                                                            title={mode}
                                                        >
                                                            {icons[mode]}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
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

                                <div>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={room.isAvailable !== false} onChange={e => updateRoomType(idx, 'isAvailable', e.target.checked)} className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500" />
                                        <span className="text-sm font-bold text-gray-700">Kamar Tersedia</span>
                                    </label>
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
    const [rentTransactions, setRentTransactions] = useState<any[]>([]);
    const [selectedRentTrxIds, setSelectedRentTrxIds] = useState<string[]>([]);

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
    }, [activeMenu, isAdmin, uid, dashboardViewMode]);

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
    const [dummyMitra, setDummyMitra] = useState<any[]>([
        { id: 'MTR-001', name: 'Pak Haji Rohim', phone: '6281234568900', email: 'haji.rohim@email.com', date: '2026-02-21', status: 'Diproses', city: 'Bogor', propertyCount: 3, businessType: 'Kos-kosan' },
        { id: 'MTR-002', name: 'Ibu Sari Dewi', phone: '6285678901234', email: 'sari.dewi@email.com', date: '2026-02-22', status: 'Menunggu', city: 'Depok', propertyCount: 1, businessType: 'Kontrakan' },
    ]);
    const [dbTransactions, setDbTransactions] = useState<AdminTransaction[]>([]);
    const [selectedDbTrxIds, setSelectedDbTrxIds] = useState<string[]>([]);
    const [selectedSurveyIds, setSelectedSurveyIds] = useState<string[]>([]);

    // MANUAL ADDITION MODALS STATE
    const [isAddingManualRent, setIsAddingManualRent] = useState(false);
    const [manualRentForm, setManualRentForm] = useState<any>({});

    const [isAddingManualDb, setIsAddingManualDb] = useState(false);
    const [manualDbForm, setManualDbForm] = useState<any>({});

    const [isAddingManualVerif, setIsAddingManualVerif] = useState(false);
    const [manualVerifForm, setManualVerifForm] = useState<any>({});

    const [isAddingManualMitra, setIsAddingManualMitra] = useState(false);
    const [manualMitraForm, setManualMitraForm] = useState<any>({});
    const handleManualRentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsAddingManualRent(false);
        if (!isAdmin) {
            alert('Akses ditolak.');
            return;
        }
        try {
            await supabase.from('transactions').insert({
                user_id: uid, 
                product_id: '00000000-0000-0000-0000-000000000000', 
                product_type: 'kost_booking',
                amount: Number(manualRentForm.amount) || 0,
                status: manualRentForm.status === 'Selesai' ? 'paid' : 'pending',
                payment_method: manualRentForm.paymentMethod || 'Manual Input',
                metadata: {
                    name: manualRentForm.name || '-',
                    phone: manualRentForm.phone || '-',
                    email: manualRentForm.email || '-',
                    kostName: manualRentForm.item || '-',
                    roomType: manualRentForm.roomType || '-',
                    period: manualRentForm.periodLabel || 'Bulanan',
                    startDate: manualRentForm.startDate || '-',
                    endDate: manualRentForm.endDate || '-'
                }
            });
            alert('Transaksi manual ditambahkan!');
        } catch(e) {
            console.error(e);
            alert('Gagal menambah transaksi manual');
        }
        setManualRentForm({});
    };

    const handleManualDbSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        alert('Fitur tambah manual dinonaktifkan sementara. Transaksi akan muncul otomatis saat ada pembelian.');
        setIsAddingManualDb(false);
    };

    const handleManualVerifSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            const newOrder = {
                id: `SRV-MAN-${Math.floor(Math.random() * 1000)}`,
                name: manualVerifForm.name || '-',
                phone: manualVerifForm.phone || '-',
                email: manualVerifForm.email || '-',
                kostName: manualVerifForm.kostName || '-',
                ownerPhone: manualVerifForm.ownerPhone || '-',
                kostAddress: manualVerifForm.kostAddress || '-',
                source: 'Manual Input',
                surveyDate: manualVerifForm.surveyDate || '-',
                surveyTime: manualVerifForm.surveyTime || '-',
                notes: manualVerifForm.notes || '-',
                paymentType: 'transfer',
                paymentMethod: 'Manual Input',
                date: manualVerifForm.date || new Date().toISOString().split('T')[0],
                status: manualVerifForm.status || 'Selesai',
                amount: Number(manualVerifForm.amount) || 0,
                platformFee: 0,
                invoiceId: `INV-SRV-MAN-${Math.floor(Math.random() * 1000)}`,
            };
            setDummyVerifications([newOrder, ...dummyVerifications]);
            setIsAddingManualVerif(false);
            setManualVerifForm({});
            alert('Data survey manual ditambahkan ke list dummy (hanya sesi ini)');
        } finally {
            setIsSubmitting(false);
        }
    };

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
    const handleManualMitraSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            // Analogous to Verif, update dummy state
            alert('Fitur tambah mitra manual akan segera dihubungkan ke database. Saat ini data hanya tersimpan di sesi browser.');
            setIsAddingManualMitra(false);
            setManualMitraForm({});
        } finally {
            setIsSubmitting(false);
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
                {(isAdmin || isOwner) && (
                    <>
                        <SidebarItem icon="📊" label="Ringkasan Analisis" isActive={activeMenu === 'analytics'} onClick={() => setActiveMenu('analytics')} />
                        <div className="pt-4 pb-2">
                            <p className="px-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Katalog Utama</p>
                        </div>
                        <SidebarItem icon="🏠" label="Kelola Kost" isActive={activeMenu === 'properties'} onClick={() => setActiveMenu('properties')} />
                    </>
                )}

                {isAdmin && (
                    <SidebarItem icon="🗄️" label="Kelola Database" isActive={activeMenu === 'databases'} onClick={() => setActiveMenu('databases')} />
                )}

                <div className="pt-4 pb-2">
                    <p className="px-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        {isAgent ? 'Tugas Survey' : 'Transaksi & Klien'}
                    </p>
                </div>

                {isAgent && (
                    <>
                        <SidebarItem icon="✅" label="Survey Saya" isActive={activeMenu === 'my_surveys'} onClick={() => setActiveMenu('my_surveys')} />
                        <SidebarItem icon="💰" label="Penghasilan" isActive={activeMenu === 'agent_wallet'} onClick={() => setActiveMenu('agent_wallet')} />
                    </>
                )}

                {(isAdmin || isOwner) && (
                    <SidebarItem icon="🛒" label="Sewa Kost" isActive={activeMenu === 'transactions_rent'} onClick={() => setActiveMenu('transactions_rent')} />
                )}

                {isAdmin && (
                    <>
                        <SidebarItem icon="📦" label="Pembelian DB" isActive={activeMenu === 'transactions_db'} onClick={() => setActiveMenu('transactions_db')} />
                        <SidebarItem icon="✅" label="Verifikasi Kost" isActive={activeMenu === 'verifikasi'} onClick={() => setActiveMenu('verifikasi')} />
                        <div className="pt-4 pb-2">
                            <p className="px-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Pendaftaran</p>
                        </div>
                        <SidebarItem icon="🤝" label="Pendaftar Mitra" isActive={activeMenu === 'mitra'} onClick={() => setActiveMenu('mitra')} />
                        <SidebarItem icon="🛡️" label="Verifikasi Agen" isActive={activeMenu === 'agent_verification'} onClick={() => setActiveMenu('agent_verification')} />
                    </>
                )}

                {(isAdmin || isOwner) && (
                    <SidebarItem icon="🛠️" label="Komplain" isActive={activeMenu === 'complaints'} onClick={() => setActiveMenu('complaints')} />
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

    const renderAnalytics = () => {
        // Use real data from analyticsSummary
        const statsGeneral = {
            users: analyticsSummary?.totalUsers || 0,
            revenue: analyticsSummary?.totalRevenue || 0,
            mitra: analyticsSummary?.totalMitra || 0,
            dbActive: analyticsSummary?.totalDatabases || 0
        };

        const statsKost = analyticsSummary?.kostStats || { users: 0, active: 0, revenue: 0 };
        const statsDb = analyticsSummary?.dbStats || { buyers: 0, active: 0, revenue: 0 };
        const statsVerif = analyticsSummary?.verifStats || { orders: 0, revenue: 0 };

        // Use real trend data from analyticsSummary
        const trendData = analyticsSummary?.trendData || [];

        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                {/* Header Analisis & Filter */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Ringkasan Analisis</h2>
                        <p className="text-gray-500 text-sm mt-1">Pantau performa bisnis dan pertumbuhan pengguna RuangSinggah.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 items-center w-full md:w-auto">
                        {dateFilter === 'custom' && (
                            <div className="flex gap-2 items-center bg-gray-50 p-1.5 rounded-lg border border-gray-200">
                                <input
                                    type="date"
                                    value={customStartDate}
                                    onChange={(e) => {
                                        setCustomStartDate(e.target.value);
                                        // Validasi: Kosongkan End Date jika melampaui batas max 3 bulan dari start date yang baru
                                        if (customEndDate) {
                                            const start = new Date(e.target.value);
                                            const end = new Date(customEndDate);
                                            const maxEnd = new Date(start);
                                            maxEnd.setMonth(start.getMonth() + 3);
                                            if (end < start || end > maxEnd) setCustomEndDate('');
                                        }
                                    }}
                                    className="text-xs bg-white border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                />
                                <span className="text-gray-400 text-xs font-bold">-</span>
                                <input
                                    type="date"
                                    min={customStartDate}
                                    max={getMaxEndDate()}
                                    value={customEndDate}
                                    onChange={(e) => setCustomEndDate(e.target.value)}
                                    className="text-xs bg-white border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                />
                            </div>
                        )}
                        {dateFilter === 'tahunan' && (
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(e.target.value)}
                                className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-orange-500 focus:border-orange-500 block p-2.5 font-bold outline-none"
                            >
                                {Array.from({ length: Math.max(1, currentYear - 2025 + 1) }, (_, i) => 2025 + i).map(year => (
                                    <option key={year} value={year.toString()}>{year}</option>
                                ))}
                            </select>
                        )}
                        <select
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-orange-500 focus:border-orange-500 block w-full md:w-auto p-2.5 font-bold uppercase tracking-wider outline-none"
                        >
                            <option value="all">Semua Waktu</option>
                            <option value="hari_ini">Hari Ini</option>
                            <option value="minggu_ini">Minggu Ini</option>
                            <option value="bulan_ini">Bulan Ini</option>
                            <option value="tahunan">Tahunan</option>
                            <option value="custom">Rentang Kustom</option>
                        </select>
                    </div>
                </div>

                {/* GENERAL SUMMARY SECTION */}
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 shadow-inner">
                    <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <span className="text-xl">🌐</span> Ringkasan Umum
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <StatCard title="Total Pengguna" value={statsGeneral.users.toString()} icon="👥" color="bg-blue-100 text-blue-700" />
                        <StatCard title="Total Pendapatan" value={FORMAT_CURRENCY(statsGeneral.revenue)} icon="💰" color="bg-orange-100 text-orange-700" />
                        <StatCard title="Total Mitra Aktif" value={statsGeneral.mitra.toString()} icon="🤝" color="bg-emerald-100 text-emerald-700" />
                        <StatCard title="Total Database Aktif" value={statsGeneral.dbActive.toString()} icon="🗄️" color="bg-purple-100 text-purple-700" />
                    </div>

                    {/* Chart Tren Ringkasan Umum */}
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Tren Pengguna vs Pendapatan</h4>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorPendapatan" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorPengguna" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} dy={10} />
                                    <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={(value) => `${value / 1000000}M`} />
                                    <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                                    <RechartsTooltip content={<CustomTooltip />} />
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <Area yAxisId="left" type="monotone" dataKey="pendapatan" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorPendapatan)" name="Pendapatan" />
                                    <Area yAxisId="right" type="monotone" dataKey="pengguna" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorPengguna)" name="Pengguna Aktif" />
                                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* KOST SECTION */}
                <div>
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <span className="text-xl">🏠</span> Performa Berlangganan / Sewa Kost
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <StatCard title="Total Penyewa Baru" value={statsKost.users.toString()} icon="👥" color="bg-blue-50 text-blue-600" />
                        <StatCard title="Total Kost Tersewa" value={statsKost.active.toString()} icon="🔑" color="bg-green-50 text-green-600" />
                        <StatCard title="Pendapatan Sewa (Est)" value={FORMAT_CURRENCY(statsKost.revenue)} icon="💰" color="bg-orange-50 text-orange-600" />
                    </div>

                    {/* Chart Tren Sewa Kost */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Grafik Tren Sewa Baru</h4>
                        <div className="h-56 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={trendData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                                    <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                                    <Bar dataKey="sewa" fill="#22c55e" radius={[4, 4, 0, 0]} name="Sewa Baru" maxBarSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* DB SECTION */}
                <div>
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2 mt-8">
                        <span className="text-xl">🗄️</span> Performa Penjualan Database
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <StatCard title="Total Pembeli Baru" value={statsDb.buyers.toString()} icon="🛒" color="bg-indigo-50 text-indigo-600" />
                        <StatCard title="Total File Terjual" value={statsDb.active.toString()} icon="📦" color="bg-purple-50 text-purple-600" />
                        <StatCard title="Pendapatan Penjualan DB" value={FORMAT_CURRENCY(statsDb.revenue)} icon="💳" color="bg-pink-50 text-pink-600" />
                    </div>

                    {/* Chart Tren Penjualan Database */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Grafik Tren Penjualan DB</h4>
                        <div className="h-56 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trendData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorDb" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                                    <RechartsTooltip content={<CustomTooltip />} />
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <Area type="monotone" dataKey="db" stroke="#a855f7" strokeWidth={3} fillOpacity={1} fill="url(#colorDb)" name="Pembelian DB" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* VERIFIKASI SECTION */}
                <div>
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2 mt-8">
                        <span className="text-xl">✅</span> Performa Layanan Verifikasi Kost
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <StatCard title="Total Pesanan" value={statsVerif.orders.toString()} icon="📝" color="bg-orange-50 text-orange-600" />
                        <StatCard title="Pendapatan Verifikasi" value={FORMAT_CURRENCY(statsVerif.revenue)} icon="💰" color="bg-pink-50 text-pink-600" />
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
                            <div>
                                <h4 className="font-bold text-gray-900 text-sm">Target vs Pencapaian Verifikasi Kost</h4>
                                <div className="mt-4">
                                    <div className="flex justify-between items-end mb-2">
                                        <p className="text-4xl font-black text-gray-900">{statsVerif.orders} <span className="text-sm text-gray-400 font-medium">pesanan {dateFilter !== 'all' ? 'periode ini' : ''}</span></p>
                                        <p className="text-sm font-bold text-orange-500">{FORMAT_CURRENCY(statsVerif.revenue)}</p>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2 mb-1">
                                        <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${Math.min(100, (statsVerif.orders / 100) * 100)}%` }}></div>
                                    </div>
                                    <p className="text-xs text-gray-500 flex justify-between">
                                        <span>Target Bulanan: 100</span>
                                        <span className="font-bold">{(statsVerif.orders / 100 * 100).toFixed(0)}%</span>
                                    </p>
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* NEW GRAPH FOR VERIFIKASI KOST */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mt-6">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-lg font-black text-gray-900">Performa Layanan Verifikasi Kost</h3>
                                <p className="text-xs text-gray-500 font-medium mt-1">Tren pesanan bulanan berdasarkan layanan video call langsung eksklusif.</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Pesanan Aktual</p>
                                <p className="text-xl font-bold text-gray-900">{statsVerif.orders}</p>
                            </div>
                        </div>
                        <div className="w-full h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={trendData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                                    <YAxis yAxisId="left" orientation="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dx={-10} />
                                    <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dx={10} tickFormatter={(val) => `Rp ${val / 1000000}M`} />
                                    <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                                    <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                                    <Bar yAxisId="left" dataKey="verifikasi" name="Jumlah Verifikasi" stroke="#8b5cf6" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                    {/* Menganimasikan tren pendapatan verifikasi berdasar harga dinamis menggunakan mapping in-place (simulasi) */}
                                    <Bar yAxisId="right" dataKey={(data) => data.verifikasi * (verifikasiPrice || 70000)} name="Pendapatan (Hrg Config)" stroke="#f59e0b" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

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

    const renderComplaints = () => (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-6xl mx-auto pb-10">
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Daftar Komplain Penghuni</h2>
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm overflow-hidden">
                {complaints.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">Belum ada komplain yang masuk.</div>
                ) : (
                    <table className="w-full text-left text-sm text-gray-500">
                        <thead className="bg-gray-50/50 text-xs font-black text-gray-500 uppercase tracking-widest border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4">Laporan</th>
                                <th className="px-6 py-4">Info User</th>
                                <th className="px-6 py-4">Problem</th>
                                <th className="px-6 py-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {complaints.map(c => (
                                <tr key={c.id}>
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-gray-900">{c.createdAt ? new Date(c.createdAt.seconds * 1000).toLocaleDateString('id-ID') : '-'}</p>
                                        <p className="text-[10px] text-gray-400 uppercase">{c.id.slice(0, 8)}</p>
                                        <span className={`inline-flex px-3 py-1 text-[10px] font-black uppercase mt-2 tracking-wider rounded-lg border ${c.status === 'open' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                                            {c.status === 'open' ? 'TERBUKA' : 'SELESAI'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-gray-700">{c.userName || '-'}</p>
                                        <p className="text-xs text-blue-500 cursor-pointer hover:underline" onClick={() => window.open('https://wa.me/' + (c.userPhone || ''))}>{c.userPhone || '-'}</p>
                                        <p className="text-xs text-gray-500 mt-1 font-bold">{c.kostName || '-'}</p>
                                    </td>
                                    <td className="px-6 py-4 max-w-xs">
                                        <p className="font-bold text-red-600 truncate">{c.title || '-'}</p>
                                        <p className="text-xs text-gray-500 line-clamp-2 mt-1">{c.description || '-'}</p>
                                        {c.photoUrl && (
                                            <button onClick={() => window.open(c.photoUrl, '_blank')} className="mt-2 text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                                                📸 Lihat Foto Lampiran
                                            </button>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {c.status === 'open' ? (
                                            <button onClick={() => handleUpdateComplaintStatus(c.id, 'closed')} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-bold active:scale-95 shadow-sm transition-colors">
                                                Tandai Selesai
                                            </button>
                                        ) : (
                                            <span className="text-gray-400 text-xs font-bold">Teratasi ✔️</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );

    const renderVerifikasi = () => (
        <div className="animate-in fade-in duration-500 max-w-4xl mx-auto space-y-8 pb-10">
            <div className="bg-gradient-to-br from-violet-600 to-fuchsia-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-10 -mt-20"></div>
                <div className="relative z-10">
                    <div className="inline-flex py-1 px-3 bg-white/20 rounded-full text-[10px] font-black tracking-widest uppercase mb-4 shadow-sm backdrop-blur-md">
                        ★ Katalog Jasa RuangSinggah
                    </div>
                    <h2 className="text-3xl lg:text-4xl font-black tracking-tight drop-shadow-sm leading-tight max-w-2xl">
                        Kelola Layanan Verifikasi Kost
                    </h2>
                    <p className="text-violet-100 font-medium mt-3 text-sm lg:text-base max-w-xl leading-relaxed opacity-90">
                        Atur informasi harga, diskon, dan manfaat layanan Live Video Call Cek Lokasi yang terintegrasi langsung dengan Cart Pembayaran.
                    </p>
                </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Pengaturan Harga Layanan</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                            Harga Normal (Biaya Dasar)
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">Rp</span>
                            <input
                                type="number"
                                value={verifikasiPrice}
                                onChange={(e) => setVerifikasiPrice(Number(e.target.value))}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-4 py-4 text-gray-900 font-bold text-lg outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:bg-white transition-all"
                                placeholder="Misal: 70000"
                            />
                        </div>
                        <p className="text-xs text-gray-400 font-medium">Harga aktual yang tercermin di seluruh analitik Dashboard.</p>
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-orange-400 uppercase tracking-widest flex items-center gap-1">
                            Harga Diskon (Opsional)
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">Rp</span>
                            <input
                                type="number"
                                value={verifikasiDiscount}
                                onChange={(e) => setVerifikasiDiscount(Number(e.target.value))}
                                className="w-full bg-orange-50/30 border border-orange-100 rounded-xl pl-12 pr-4 py-4 text-orange-900 font-bold text-lg outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:bg-white transition-all"
                                placeholder="Harga setelah potongan, contoh: 50000"
                            />
                        </div>
                        <p className="text-xs text-gray-400 font-medium">Jika diisi, harga normal akan dicoret pada antarmuka Klien.</p>
                    </div>
                </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm space-y-6">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">KONTROL DESKRIPSI (LANDING PAGE)</h3>
                </div>
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                        Teks Benefit Layanan Ekstra
                    </label>
                    <textarea
                        rows={5}
                        value={verifikasiDescription}
                        onChange={(e) => setVerifikasiDescription(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-700 font-medium text-sm leading-relaxed outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:bg-white transition-all"
                        placeholder="Berikan deskripsi profesional untuk diiklankan kepada pengguna..."
                    />
                </div>

                <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex gap-3">
                    <div className="text-blue-500 shrink-0">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <p className="text-sm font-medium text-blue-900 leading-relaxed">
                        <strong>Efek Analitik:</strong> Nilai harga "<strong>{FORMAT_CURRENCY(verifikasiPrice)}</strong>" saat ini langsung dihubungkan dengan Grafik Performa Verifikasi pada Tab <span className="underline cursor-pointer" onClick={() => setActiveMenu('analytics')}>Ringkasan Analisis</span>. Perubahan Anda akan instan merevisi seluruh peta pendapatan layanan!
                    </p>
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <button
                    onClick={() => {
                        setIsSavingVerifikasi(true);
                        setTimeout(() => setIsSavingVerifikasi(false), 800);
                        alert("Katalog Layanan Verifikasi berhasil diperbarui secara global!");
                    }}
                    className={`px-8 py-3.5 rounded-xl font-bold text-white transition-all shadow-lg active:scale-95 flex items-center gap-2 ${isSavingVerifikasi ? 'bg-gray-400 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-700'}`}
                    disabled={isSavingVerifikasi}
                >
                    {isSavingVerifikasi ? (
                        <><div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></div> Menyimpan...</>
                    ) : (
                        <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Simpan Perubahan Jasa</>
                    )}
                </button>
            </div>
        </div>
    );

    const formatRentTrx = (t: any) => {
        return {
            id: t.id,
            rawDate: t.created_at,
            date: new Date(t.created_at).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' WIB',
            name: t.user?.name || t.metadata?.name || 'Penyewa',
            email: t.user?.email || t.metadata?.email,
            phone: t.user?.phone || t.metadata?.phone,
            photoURL: t.user?.photo_url || t.metadata?.photoURL,
            gender: t.user?.gender || t.metadata?.gender,
            occupation: t.user?.occupation || t.metadata?.occupation,
            institution: t.user?.institution || t.metadata?.institution,
            religion: t.user?.religion || t.metadata?.religion,
            relationshipStatus: t.user?.relationship_status || t.metadata?.relationshipStatus,
            profileAddress: t.user?.address || t.metadata?.profileAddress,
            paymentType: (t.payment_method || '').toLowerCase().includes('transfer') ? 'transfer' : 'gateway',
            item: t.metadata?.kostName || t.product_type,
            roomType: t.metadata?.roomType || '-',
            periodLabel: t.metadata?.period || '-',
            paymentMethod: t.payment_method || '-',
            amount: t.amount,
            status: (t.status === 'pending' || t.status === 'PENDING_APPROVAL') ? 'Menunggu' : (t.status === 'paid' ? 'Selesai' : (t.status === 'cancelled' || t.status === 'REJECTED' ? 'Ditolak' : t.status)),
            rawStatus: t.status,
            startDate: t.metadata?.startDate || '-',
            endDate: t.metadata?.endDate || '-',
            transferProofUrl: t.metadata?.transferProofUrl || null,
            platformFee: Number(t.metadata?.platformFee) || 0,
            invoiceId: t.pakasir_order_id || `INV-${t.id.substring(0,8).toUpperCase()}`,
            type: t.type || t.product_type || 'rent'
        };
    };

    const renderRentTransactions = () => (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
                <div className="flex flex-col gap-1">
                    <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Manajemen Transaksi Sewa Kost</h2>
                    {isAdmin && rentTransactions.length > 0 && (
                        <div className="flex items-center gap-4 mt-2">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <div className="relative flex items-center justify-center">
                                    <input
                                        type="checkbox"
                                        className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-gray-300 checked:bg-orange-500 checked:border-orange-500 transition-all"
                                        checked={selectedRentTrxIds.length === rentTransactions.length && rentTransactions.length > 0}
                                        onChange={(e) => {
                                            if (e.target.checked) setSelectedRentTrxIds(rentTransactions.map(t => t.id));
                                            else setSelectedRentTrxIds([]);
                                        }}
                                    />
                                    <svg className="absolute h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>
                                </div>
                                <span className="text-sm font-bold text-gray-600 group-hover:text-orange-600 transition-colors">Pilih Semua ({rentTransactions.length})</span>
                            </label>
                            
                            {selectedRentTrxIds.length > 0 && (
                                <button
                                    onClick={handleBulkDeleteRentTransactions}
                                    className="flex items-center gap-2 bg-red-50 hover:bg-red-500 text-red-600 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold border border-red-100 transition-all shadow-sm active:scale-95"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    Hapus {selectedRentTrxIds.length} Terpilih
                                </button>
                            )}
                        </div>
                    )}
                </div>
                {isAdmin && (
                    <button onClick={() => setIsAddingManualRent(true)} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all active:scale-95 flex items-center gap-2 shrink-0">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                        Tambah Manual
                    </button>
                )}
            </div>
            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex gap-3 mb-6">
                <div className="text-blue-500 shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <p className="text-sm font-medium text-blue-900 leading-relaxed">
                    Transaksi via <strong>Transfer Bank</strong> memerlukan verifikasi bukti mutasi manual sebelum dikonfirmasi. Transaksi via <strong>Payment Gateway</strong> terkonfirmasi otomatis oleh sistem.
                </p>
            </div>

            {/* Rent Filter Tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
                {[
                    { id: 'all', label: 'Semua Transaksi', icon: '📋' },
                    { id: 'pengajuan', label: 'Pengajuan Sewa', icon: '⏳' },
                    { id: 'realisasi', label: 'Penyewaan Terealisasi', icon: '✅' },
                    { id: 'perpanjangan', label: 'Perpanjangan Sewa', icon: '➕' }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setRentFilter(tab.id as any)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${rentFilter === tab.id
                            ? 'bg-orange-500 text-white shadow-md'
                            : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'
                            }`}
                    >
                        <span>{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-6">
                {(() => {
                    const filtered = rentTransactions.filter(t => {
                        if (rentFilter === 'all') return true;
                        
                        // Status and Type logic for filtering
                        const isPending = t.status === 'pending' || t.status === 'PENDING_APPROVAL';
                        const isPaid = ['paid', 'Selesai', 'success', 'Berhasil'].includes(t.status);
                        const isExtension = t.type === 'perpanjangan_sewa' || t.product_type === 'perpanjangan_sewa' || t.metadata?.extensionType === 'manual_extension';

                        if (rentFilter === 'pengajuan') return isPending && !isExtension;
                        if (rentFilter === 'realisasi') return isPaid;
                        if (rentFilter === 'perpanjangan') return isExtension;
                        
                        return true;
                    });

                    if (filtered.length === 0) {
                        return (
                            <div className="bg-white border text-center border-gray-100 rounded-2xl p-12 shadow-sm">
                                <p className="text-gray-500 font-medium">Belum ada data transaksi untuk kategori ini.</p>
                            </div>
                        );
                    }

                    return filtered.map((rawTrx) => {
                    const trx = formatRentTrx(rawTrx);
                    return (
                    <div key={trx.id} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row gap-6 hover:shadow-md transition-shadow relative overflow-hidden group/card">
                        {isAdmin && (
                            <div className="absolute top-4 left-4 z-[20]">
                                <div className="relative flex items-center justify-center">
                                    <input
                                        type="checkbox"
                                        className="peer h-6 w-6 cursor-pointer appearance-none rounded-lg border-2 border-gray-200 bg-white/80 backdrop-blur-sm checked:bg-orange-500 checked:border-orange-500 transition-all shadow-sm"
                                        checked={selectedRentTrxIds.includes(trx.id)}
                                        onChange={() => {
                                            setSelectedRentTrxIds(prev =>
                                                prev.includes(trx.id) ? prev.filter(id => id !== trx.id) : [...prev, trx.id]
                                            );
                                        }}
                                    />
                                    <svg className="absolute h-4 w-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>
                                </div>
                            </div>
                        )}
                        {trx.status === 'Selesai' && <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-bl-full -z-0"></div>}

                        <div className="flex-1 space-y-4 relative z-10">
                            <div className="flex flex-wrap justify-between items-start border-b border-gray-50 pb-4 gap-2">
                                <div className={isAdmin ? 'pl-8' : ''}>
                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                        <span className="bg-orange-100 text-orange-700 font-bold px-2 py-1 rounded text-[10px] uppercase tracking-wider">{trx.id.substring(0,8)}</span>
                                        <span className="text-xs text-gray-400 font-medium">Order: {trx.date}</span>
                                        <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${(trx as any).paymentType === 'gateway' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-700'}`}>
                                            {(trx as any).paymentType === 'gateway' ? '⚡ Gateway' : '🏦 Transfer Manual'}
                                        </span>
                                    </div>
                                    <p className="font-medium text-gray-500 text-sm mt-1">Penyewa: <button onClick={() => setViewingProfile(trx)} className="font-black text-orange-600 hover:text-orange-700 hover:underline underline-offset-2 transition-colors cursor-pointer text-base">{trx.name}</button></p>
                                </div>
                                <span className={`inline-flex px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-lg border ${trx.status === 'Menunggu' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                    trx.status === 'Selesai' ? 'bg-green-50 text-green-700 border-green-200' :
                                        'bg-red-50 text-red-700 border-red-200'
                                    }`}>
                                    {trx.status === 'Menunggu' ? 'Menunggu Konfirmasi' : trx.status}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Properti</p>
                                    <p className="text-sm font-bold text-gray-900">{trx.item}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Tipe Kamar</p>
                                    <p className="text-sm font-bold text-orange-600">{trx.roomType}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Durasi Sewa</p>
                                    <p className="text-sm font-bold text-blue-600">{trx.periodLabel}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Mulai Tinggal</p>
                                    <p className="text-sm font-bold text-gray-900">{trx.startDate}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Sampai</p>
                                    <p className="text-sm font-bold text-gray-900">{(trx as any).endDate}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Metode Bayar</p>
                                    <p className={`text-sm font-bold ${(trx as any).paymentType === 'gateway' ? 'text-blue-600' : 'text-amber-600'}`}>{trx.paymentMethod}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2.5 md:w-52 shrink-0 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6 relative z-10">
                            <div className="mb-1">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Total Tagihan</p>
                                <p className="text-xl font-black text-orange-500 text-right">{FORMAT_CURRENCY(trx.amount)}</p>
                                <p className="text-[11px] text-gray-400 text-right">{(trx as any).invoiceId}</p>
                            </div>

                            {(trx as any).paymentType === 'transfer' && (trx as any).transferProofUrl && (
                                <button
                                    onClick={() => setViewingProof({ id: trx.id, name: trx.name, proofUrl: (trx as any).transferProofUrl })}
                                    className="w-full bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 py-2.5 rounded-xl text-xs font-bold transition-all flex justify-center items-center gap-1.5"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                    Lihat Bukti Transfer
                                </button>
                            )}

                            {trx.status === 'Menunggu' && isAdmin && (
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={async () => {
                                            const isPendingApproval = trx.rawStatus === 'PENDING_APPROVAL';
                                            
                                            if (isPendingApproval) {
                                                if (window.confirm('Setujui pengajuan ini? System akan membuat link pembayaran dan menyiapkan pesan WhatsApp.')) {
                                                    try {
                                                        const result = await processBookingApproval(trx.id, 'accept');
                                                        if (result.success) {
                                                            alert('Booking disetujui! Membuka WhatsApp untuk kirim link pembayaran...');
                                                            if (result.whatsappUrl) window.open(result.whatsappUrl, '_blank');
                                                            loadRentTransactions();
                                                        }
                                                    } catch (err: any) {
                                                        alert('Error: ' + err.message);
                                                    }
                                                }
                                            } else {
                                                // Manual transfer verification
                                                if (window.confirm('Konfirmasi pembayaran manual ini? Status akan berubah menjadi "Selesai".')) {
                                                    await updateTransactionStatus(trx.id, 'paid');
                                                    alert('Pembayaran berhasil dikonfirmasi!');
                                                    loadRentTransactions();
                                                }
                                            }
                                        }}
                                        className="w-full bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 flex justify-center items-center gap-1"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                        {trx.rawStatus === 'PENDING_APPROVAL' ? 'Setujui' : 'Terima'}
                                    </button>
                                    <button
                                        onClick={async () => {
                                            const isPendingApproval = trx.rawStatus === 'PENDING_APPROVAL';
                                            const confirmMsg = isPendingApproval ? 'Tolak pengajuan booking ini?' : 'Batalkan transaksi ini?';
                                            
                                            if (window.confirm(confirmMsg)) {
                                                try {
                                                    if (isPendingApproval) {
                                                        const reason = window.prompt('Alasan penolakan (opsional):') || '';
                                                        const result = await processBookingApproval(trx.id, 'reject', reason);
                                                        if (result.success) {
                                                            alert('Booking ditolak.');
                                                            if (result.whatsappUrl) window.open(result.whatsappUrl, '_blank');
                                                        }
                                                    } else {
                                                        await updateTransactionStatus(trx.id, 'cancelled');
                                                        alert('Transaksi dibatalkan.');
                                                    }
                                                    loadRentTransactions();
                                                } catch (err: any) {
                                                    alert('Error: ' + err.message);
                                                }
                                            }
                                        }}
                                        className="w-full bg-red-50 hover:bg-red-100 text-red-600 py-2.5 rounded-xl text-xs font-bold transition-all border border-red-200 active:scale-95 flex justify-center items-center gap-1"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                        Tolak
                                    </button>
                                </div>
                            )}

                            <button
                                onClick={() => setViewingInvoice(trx)}
                                className="w-full bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200 py-2.5 rounded-xl text-xs font-bold transition-all flex justify-center items-center gap-1.5"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                Lihat Invoice
                            </button>

                            {isAdmin && (
                                <button
                                    onClick={() => window.open(`https://wa.me/${trx.phone}?text=${encodeURIComponent(`Halo ${trx.name}, saya Admin RuangSinggah.id. Kami ingin melakukan konfirmasi terkait transaksi sewa kost Anda (${trx.id}) untuk properti ${trx.item}. Mohon bantuannya. Terima kasih.`)}`, '_blank')}
                                    className="w-full bg-green-50 hover:bg-green-500 text-green-600 hover:text-white border border-green-200 py-2.5 rounded-xl text-xs font-bold transition-all flex justify-center items-center gap-1.5 group"
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.711.956 2.873.956 3.182 0 5.768-2.585 5.77-5.765.001-3.181-2.586-5.768-5.768-5.768zm3.333 8.33c-.15.424-.877.817-1.229.845-.306.024-.652.128-2.146-.464-1.801-.715-2.956-2.548-3.047-2.671-.09-.122-.727-.968-.727-1.844 0-.875.452-1.304.613-1.472.161-.168.351-.21.468-.21.117 0 .234.004.336.008.109.006.255-.044.398.303.151.365.518 1.264.565 1.356.046.091.077.198.016.321-.061.121-.092.197-.184.304-.092.107-.193.226-.275.319-.092.105-.188.22-.083.402.105.183.468.775 1.002 1.25.688.614 1.27.8 1.455.892.183.092.29.077.397-.038.106-.115.46-.537.583-.721.122-.184.244-.154.409-.092.165.061 1.042.492 1.221.583.179.092.298.138.341.214.043.076.043.447-.107.871z" /></svg>
                                    Follow Up WA
                                </button>
                            )}
                            {isAdmin && (
                                <button
                                    onClick={() => handleDeleteRentTransaction(trx.id)}
                                    className="w-full bg-white hover:bg-red-50 text-gray-400 hover:text-red-500 border border-gray-100 hover:border-red-100 py-2.5 rounded-xl text-xs font-bold transition-all flex justify-center items-center gap-1.5 opacity-0 group-hover/card:opacity-100"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    Hapus Transaksi
                                </button>
                            )}
                        </div>
                    </div>
                    );
                })
            })()}
            </div>

            {/* ── MODAL: PROFIL PENYEWA ─────────────────────── */}

            {viewingProfile && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setViewingProfile(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        {/* Header Profil */}
                        <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-5 text-white relative shrink-0">
                            <div className="flex items-center gap-4">
                                {viewingProfile.photoURL ? (
                                    <img src={viewingProfile.photoURL} alt={viewingProfile.name} className="w-16 h-16 rounded-full border-2 border-white/30 object-cover shrink-0" />
                                ) : (
                                    <div className="w-16 h-16 rounded-full bg-orange-500 flex items-center justify-center text-white text-xl font-black shrink-0">
                                        {viewingProfile.name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-black tracking-widest uppercase opacity-60">Profil Penyewa</p>
                                    <h3 className="text-lg font-black truncate">{viewingProfile.name}</h3>
                                    <p className="text-xs opacity-70 truncate">{viewingProfile.email}</p>
                                </div>
                                <button onClick={() => setViewingProfile(null)} className="p-2 rounded-xl hover:bg-white/10 transition-colors shrink-0">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        </div>

                        {/* Body Profil */}
                        <div className="overflow-y-auto p-5 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No. WhatsApp</p>
                                    <p className="font-bold text-gray-900 mt-0.5">{viewingProfile.phone}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Jenis Kelamin</p>
                                    <p className="font-bold text-gray-900 mt-0.5">{viewingProfile.gender || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pekerjaan</p>
                                    <p className="font-bold text-gray-900 mt-0.5">{viewingProfile.occupation || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Institusi / Kampus</p>
                                    <p className="font-bold text-gray-900 mt-0.5">{viewingProfile.institution || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Agama</p>
                                    <p className="font-bold text-gray-900 mt-0.5">{viewingProfile.religion || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Status Hubungan</p>
                                    <p className="font-bold text-gray-900 mt-0.5">{viewingProfile.relationshipStatus || '-'}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Alamat Domisili</p>
                                    <p className="font-bold text-gray-900 mt-0.5 leading-relaxed">{viewingProfile.profileAddress || '-'}</p>
                                </div>
                            </div>

                            {/* Transaksi Terkait */}
                            <div className="border-t border-gray-100 pt-4">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Transaksi Terkait</p>
                                <div className="bg-gray-50 rounded-xl p-3 flex justify-between items-center">
                                    <div>
                                        <p className="text-xs font-black text-gray-500">{viewingProfile.id} · {viewingProfile.item}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">{viewingProfile.roomType} · {viewingProfile.periodLabel}</p>
                                    </div>
                                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${viewingProfile.status === 'Selesai' ? 'bg-green-100 text-green-700' : viewingProfile.status === 'Menunggu' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                        {viewingProfile.status}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Footer: Follow Up WA */}
                        <div className="p-4 border-t border-gray-100 shrink-0">
                            <button
                                onClick={() => window.open(`https://wa.me/${viewingProfile.phone}?text=${encodeURIComponent(`Halo ${viewingProfile.name}, saya Admin RuangSinggah.id. Kami ingin melakukan konfirmasi terkait transaksi Anda (${viewingProfile.id}) untuk properti ${viewingProfile.item}. Mohon bantuannya. Terima kasih.`)}`, '_blank')}
                                className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl text-sm font-bold transition-all flex justify-center items-center gap-2 shadow-sm"
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.711.956 2.873.956 3.182 0 5.768-2.585 5.77-5.765.001-3.181-2.586-5.768-5.768-5.768zm3.333 8.33c-.15.424-.877.817-1.229.845-.306.024-.652.128-2.146-.464-1.801-.715-2.956-2.548-3.047-2.671-.09-.122-.727-.968-.727-1.844 0-.875.452-1.304.613-1.472.161-.168.351-.21.468-.21.117 0 .234.004.336.008.109.006.255-.044.398.303.151.365.518 1.264.565 1.356.046.091.077.198.016.321-.061.121-.092.197-.184.304-.092.107-.193.226-.275.319-.092.105-.188.22-.083.402.105.183.468.775 1.002 1.25.688.614 1.27.8 1.455.892.183.092.29.077.397-.038.106-.115.46-.537.583-.721.122-.184.244-.154.409-.092.165.061 1.042.492 1.221.583.179.092.298.138.341.214.043.076.043.447-.107.871z" /></svg>
                                Hubungi via WhatsApp
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── MODAL: BUKTI TRANSFER ─────────────────────── */}
            {viewingProof && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setViewingProof(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-5 border-b border-gray-100">
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Bukti Transfer</p>
                                <h3 className="text-base font-black text-gray-900 mt-0.5">{viewingProof.id} — {viewingProof.name}</h3>
                            </div>
                            <button onClick={() => setViewingProof(null)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="p-4">
                            <img src={viewingProof.proofUrl} alt="Bukti Transfer" className="w-full rounded-xl border border-gray-100 object-cover max-h-80" />
                        </div>
                        <div className="bg-yellow-50 border-t border-yellow-100 px-5 py-3 flex items-center gap-2">
                            <span className="text-yellow-500 text-sm">⚠️</span>
                            <p className="text-xs text-yellow-800 font-medium">Verifikasi kesesuaian jumlah dan rekening tujuan sebelum menekan "Terima".</p>
                        </div>
                    </div>
                </div>
            )}

            {/* ── MODAL: INVOICE ────────────────────────────── */}
            {viewingInvoice && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setViewingInvoice(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="bg-gradient-to-r from-orange-500 to-orange-400 p-5 text-white">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs font-black tracking-widest uppercase opacity-80">RuangSinggah.id</p>
                                    <h3 className="text-xl font-black mt-1">{viewingInvoice.invoiceId}</h3>
                                    <p className="text-xs mt-1 opacity-70">Diterbitkan: {viewingInvoice.date}</p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${viewingInvoice.status === 'Selesai' ? 'bg-white/30 text-white' : viewingInvoice.status === 'Menunggu' ? 'bg-yellow-300/30 text-yellow-100' : 'bg-red-300/30 text-red-100'}`}>
                                    {viewingInvoice.status}
                                </span>
                            </div>
                        </div>

                        <div className="p-5 space-y-4">
                            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Penyewa</p>
                                    <p className="font-bold text-gray-900">{viewingInvoice.name}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Properti</p>
                                    <p className="font-bold text-gray-900">{viewingInvoice.item}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tipe Kamar</p>
                                    <p className="font-bold text-orange-600">{viewingInvoice.roomType}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Durasi</p>
                                    <p className="font-bold text-blue-600">{viewingInvoice.periodLabel}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Masa Sewa</p>
                                    <p className="font-bold text-gray-900">{viewingInvoice.startDate} — {viewingInvoice.endDate}</p>
                                </div>
                            </div>

                            <div className="border-t border-dashed border-gray-200 pt-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Biaya Sewa ({viewingInvoice.periodLabel})</span>
                                    <span className="font-bold">{FORMAT_CURRENCY(viewingInvoice.amount - viewingInvoice.platformFee)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Biaya Platform</span>
                                    <span className="font-bold">{FORMAT_CURRENCY(viewingInvoice.platformFee)}</span>
                                </div>
                                <div className="flex justify-between text-sm font-black text-gray-900 border-t border-gray-100 pt-2">
                                    <span>Total Dibayar</span>
                                    <span className="text-orange-500 text-base">{FORMAT_CURRENCY(viewingInvoice.amount)}</span>
                                </div>
                            </div>

                            <div className={`rounded-xl p-3 flex gap-3 items-center ${viewingInvoice.paymentType === 'gateway' ? 'bg-blue-50 border border-blue-100' : 'bg-amber-50 border border-amber-100'}`}>
                                <span className="text-xl shrink-0">{viewingInvoice.paymentType === 'gateway' ? '⚡' : '🏦'}</span>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Metode Pembayaran</p>
                                    <p className="font-bold text-gray-900 text-sm">{viewingInvoice.paymentMethod}</p>
                                </div>
                            </div>

                            <div className="flex gap-2 pt-1">
                                <button onClick={() => setViewingInvoice(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl text-xs font-bold transition-all">
                                    Tutup
                                </button>
                                <button onClick={() => window.print()} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-xl text-xs font-bold transition-all flex justify-center items-center gap-1.5 shadow-sm">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                                    Cetak Invoice
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    const renderDbTransactions = () => (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Manajemen Pembelian Database</h2>
                    <p className="text-gray-500 text-sm mt-1">Total {dbTransactions.length} transaksi tercatat.</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    {selectedDbTrxIds.length > 0 && (
                        <button 
                            onClick={handleBulkDeleteTransactions}
                            className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2.5 rounded-xl text-sm font-bold border border-red-200 shadow-sm transition-all active:scale-95 flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            Hapus Terpilih ({selectedDbTrxIds.length})
                        </button>
                    )}
                    <button onClick={() => setIsAddingManualDb(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all active:scale-95 flex items-center gap-2 shrink-0">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                        Tambah Manual
                    </button>
                </div>
            </div>

            {dbTransactions.length > 0 && (
                <div className="flex items-center gap-2 px-1 py-2">
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <input 
                            type="checkbox" 
                            className="w-5 h-5 text-blue-600 rounded-lg border-gray-300 focus:ring-blue-500 transition-all cursor-pointer"
                            checked={dbTransactions.length > 0 && selectedDbTrxIds.length === dbTransactions.length}
                            onChange={(e) => {
                                if (e.target.checked) {
                                    setSelectedDbTrxIds(dbTransactions.map(t => t.id));
                                } else {
                                    setSelectedDbTrxIds([]);
                                }
                            }}
                        />
                        <span className="text-sm font-black text-gray-500 uppercase tracking-widest group-hover:text-blue-600 transition-colors">Pilih Semua</span>
                    </label>
                </div>
            )}

            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex gap-3 mb-2">
                <span className="text-blue-500 shrink-0">📦</span>
                <p className="text-sm font-medium text-blue-900">Transaksi via <strong>Transfer Bank</strong> perlu verifikasi bukti pembayaran sebelum akses database diberikan kepada pembeli.</p>
            </div>
            
            <div className="grid grid-cols-1 gap-6">
                {dbTransactions.length === 0 ? (
                    <div className="bg-white border-2 border-dashed border-gray-100 rounded-3xl p-12 text-center">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">📭</div>
                        <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-2">Belum Ada Transaksi</h3>
                        <p className="text-gray-500 max-w-sm mx-auto font-medium">Semua pembelian database melalui website akan otomatis muncul di sini secara real-time.</p>
                    </div>
                ) : dbTransactions.map((trx: AdminTransaction) => {
                    const metadata = trx.metadata || {};
                    const buyer = trx.user || { name: 'Unknown', email: '-', phone: '-' };
                    const dbInfo = trx.database || { campus: '', city: '', area: '', file_type: '', price: 0 };
                    const createdAtDate = new Date(trx.created_at);
                    const createdAt = createdAtDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

                    // Map fields based on user feedback
                    const dbName = metadata.dbName || (dbInfo.campus ? `${dbInfo.campus} - ${dbInfo.city}` : '-');
                    const dbType = metadata.dbType || (dbInfo.file_type === 'link' ? 'Link Drive/Excel' : dbInfo.file_type === 'upload' ? 'File PDF/Original' : '-');
                    const dbCity = metadata.dbCity || dbInfo.city || '-';
                    const dbYear = metadata.dbYear || createdAtDate.getFullYear().toString();
                    const paymentMethod = trx.payment_method || (trx.payment_method === null ? 'Belum dipilih' : '-');

                    // Status mapping
                    const displayStatus = trx.status === 'paid' ? 'Selesai' : trx.status === 'pending' ? 'Menunggu' : 'Dibatalkan';
                    const isManual = (paymentMethod || '').toLowerCase().includes('manual') || (paymentMethod || '').toLowerCase().includes('transfer');
                    
                    const isSelected = selectedDbTrxIds.includes(trx.id);

                    // Invoice data
                    const invoiceData = {
                        ...trx,
                        ...metadata,
                        ...buyer,
                        dbName,
                        dbType,
                        dbCity,
                        dbYear,
                        paymentMethod,
                        date: createdAt,
                        invoiceId: trx.pakasir_order_id || trx.id.substring(0, 12).toUpperCase(),
                        amount: Number(trx.amount) || 0,
                        platformFee: Number(metadata.platformFee) || 0
                    };

                    return (
                        <div key={trx.id} className={`bg-white border ${isSelected ? 'border-blue-400 ring-2 ring-blue-50 shadow-md' : 'border-gray-100 shadow-sm'} rounded-2xl p-6 flex flex-col md:flex-row gap-6 hover:shadow-md transition-all relative overflow-hidden group`}>
                            {trx.status === 'paid' && <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-bl-full -z-0"></div>}
                            
                            {/* Checkbox Overlay/Side */}
                            <div className="absolute top-6 left-6 z-20">
                                <input 
                                    type="checkbox" 
                                    className="w-6 h-6 text-blue-600 rounded-lg border-gray-300 focus:ring-blue-500 transition-all cursor-pointer shadow-sm"
                                    checked={isSelected}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setSelectedDbTrxIds([...selectedDbTrxIds, trx.id]);
                                        } else {
                                            setSelectedDbTrxIds(selectedDbTrxIds.filter(id => id !== trx.id));
                                        }
                                    }}
                                />
                            </div>

                            <div className="flex-1 space-y-4 relative z-10 pl-10">
                                <div className="flex flex-wrap justify-between items-start border-b border-gray-50 pb-4 gap-2">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                                            <span className="bg-blue-100 text-blue-700 font-bold px-2 py-1 rounded text-[10px] uppercase tracking-wider">{trx.id.substring(0, 8)}</span>
                                            <span className="text-xs text-gray-400 font-medium">Dipesan: {createdAt}</span>
                                            <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${!isManual ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-700'}`}>{!isManual ? '⚡ Gateway' : '🏦 Transfer Manual'}</span>
                                        </div>
                                        <p className="font-medium text-gray-500 text-sm">Pembeli: <button onClick={() => setViewingDbProfile({ ...buyer, ...metadata, dbName, dbType, dbCity, dbYear, status: displayStatus, id: trx.id, date: createdAt })} className="font-black text-orange-600 hover:text-orange-700 hover:underline underline-offset-2 transition-colors text-base">{buyer.name}</button></p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`inline-flex px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-lg border ${trx.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : trx.status === 'paid' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>{displayStatus}</span>
                                        <button 
                                            onClick={() => handleDeleteTransaction(trx.id)}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all active:scale-95"
                                            title="Hapus Transaksi"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nama Database</p><p className="text-sm font-bold text-gray-900 mt-0.5">{dbName}</p></div>
                                    <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Jenis Data</p><p className="text-sm font-bold text-blue-600 mt-0.5">{dbType}</p></div>
                                    <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Kota / Tahun</p><p className="text-sm font-bold text-gray-900 mt-0.5">{dbCity} · {dbYear}</p></div>
                                    <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Order ID</p><p className="text-sm font-bold text-gray-900 mt-0.5">{trx.pakasir_order_id || trx.id.substring(0, 12)}</p></div>
                                    <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Metode Bayar</p><p className={`text-sm font-bold mt-0.5 ${!isManual ? 'text-blue-600' : 'text-amber-600'}`}>{paymentMethod}</p></div>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2.5 md:w-52 shrink-0 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6 relative z-10">
                                <div className="mb-1">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Total Tagihan</p>
                                    <p className="text-xl font-black text-orange-500 text-right">{FORMAT_CURRENCY(trx.amount)}</p>
                                </div>
                                {isManual && metadata.transferProofUrl && (
                                    <button onClick={() => setViewingDbProof({ id: trx.id, name: buyer.name, proofUrl: metadata.transferProofUrl })} className="w-full bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 py-2.5 rounded-xl text-xs font-bold transition-all flex justify-center items-center gap-1.5">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                        Lihat Bukti Transfer
                                    </button>
                                )}
                                {trx.status === 'pending' && (
                                    <div className="grid grid-cols-2 gap-2">
                                        <button onClick={async () => {
                                            if (window.confirm('Warnai transaksi ini sebagai Selesai/Paid?')) {
                                                await updateTransactionStatus(trx.id, 'paid');
                                                loadDbTransactions();
                                            }
                                        }} className="w-full bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-xl text-xs font-bold active:scale-95 flex justify-center items-center gap-1">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Terima
                                        </button>
                                        <button onClick={async () => {
                                            if (window.confirm('Batalkan transaksi ini?')) {
                                                await updateTransactionStatus(trx.id, 'cancelled');
                                                loadDbTransactions();
                                            }
                                        }} className="w-full bg-red-50 hover:bg-red-100 text-red-600 py-2.5 rounded-xl text-xs font-bold border border-red-200 active:scale-95 flex justify-center items-center gap-1">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>Tolak
                                        </button>
                                    </div>
                                )}
                                <button onClick={() => setViewingDbInvoice(invoiceData)} className="w-full bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200 py-2.5 rounded-xl text-xs font-bold transition-all flex justify-center items-center gap-1.5">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                    Invoice Details
                                </button>
                                <button onClick={() => window.open(`https://wa.me/${buyer.phone}?text=${encodeURIComponent(`Halo ${buyer.name}, Admin RuangSinggah. Konfirmasi pesanan database (${trx.id.substring(0, 8)}) - ${dbName}. Mohon bantuannya.`)}`, '_blank')} className="w-full bg-green-50 hover:bg-green-500 text-green-600 hover:text-white border border-green-200 py-2.5 rounded-xl text-xs font-bold transition-all flex justify-center items-center gap-1.5">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.711.956 2.873.956 3.182 0 5.768-2.585 5.77-5.765.001-3.181-2.586-5.768-5.768-5.768zm3.333 8.33c-.15.424-.877.817-1.229.845-.306.024-.652.128-2.146-.464-1.801-.715-2.956-2.548-3.047-2.671-.09-.122-.727-.968-.727-1.844 0-.875.452-1.304.613-1.472.161-.168.351-.21.468-.21.117 0 .234.004.336.008.109.006.255-.044.398.303.151.365.518 1.264.565 1.356.046.091.077.198.016.321-.061.121-.092.197-.184.304-.092.107-.193.226-.275.319-.092.105-.188.22-.083.402.105.183.468.775 1.002 1.25.688.614 1.27.8 1.455.892.183.092.29.077.397-.038.106-.115.46-.537.583-.721.122-.184.244-.154.409-.092.165.061 1.042.492 1.221.583.179.092.298.138.341.214.043.076.043.447-.107.871z" /></svg>
                                    Follow Up WA
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
            {viewingDbProfile && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setViewingDbProfile(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-5 text-white shrink-0">
                            <div className="flex items-center gap-4">
                                {viewingDbProfile.photoURL ? <img src={viewingDbProfile.photoURL} alt="" className="w-16 h-16 rounded-full border-2 border-white/30 object-cover shrink-0" /> : <div className="w-16 h-16 rounded-full bg-orange-500 flex items-center justify-center text-xl font-black shrink-0">{viewingDbProfile.name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}</div>}
                                <div className="flex-1 min-w-0"><p className="text-[10px] font-black tracking-widest uppercase opacity-60">Profil Pembeli</p><h3 className="text-lg font-black truncate">{viewingDbProfile.name}</h3><p className="text-xs opacity-70 truncate">{viewingDbProfile.email}</p></div>
                                <button onClick={() => setViewingDbProfile(null)} className="p-2 rounded-xl hover:bg-white/10 shrink-0"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                            </div>
                        </div>
                        <div className="overflow-y-auto p-5 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No. WhatsApp</p><p className="font-bold text-gray-900 mt-0.5">{viewingDbProfile.phone}</p></div>
                                <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Jenis Kelamin</p><p className="font-bold text-gray-900 mt-0.5">{viewingDbProfile.gender || '-'}</p></div>
                                <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pekerjaan</p><p className="font-bold text-gray-900 mt-0.5">{viewingDbProfile.occupation || '-'}</p></div>
                                <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Institusi</p><p className="font-bold text-gray-900 mt-0.5">{viewingDbProfile.institution || '-'}</p></div>
                                <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Agama</p><p className="font-bold text-gray-900 mt-0.5">{viewingDbProfile.religion || '-'}</p></div>
                                <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</p><p className="font-bold text-gray-900 mt-0.5">{viewingDbProfile.relationshipStatus || '-'}</p></div>
                                <div className="col-span-2"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Database Dibeli</p><p className="font-bold text-blue-600 mt-0.5">{viewingDbProfile.dbName}</p></div>
                                <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Jenis</p><p className="font-bold text-gray-900 mt-0.5">{viewingDbProfile.dbType}</p></div>
                                <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Status Pesanan</p><span className={`px-2 py-1 rounded-lg text-xs font-black inline-block mt-0.5 ${viewingDbProfile.status === 'Selesai' ? 'bg-green-100 text-green-700' : viewingDbProfile.status === 'Menunggu' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{viewingDbProfile.status}</span></div>
                            </div>
                        </div>
                        <div className="p-4 border-t border-gray-100 shrink-0">
                            <button onClick={() => window.open(`https://wa.me/${viewingDbProfile.phone}?text=${encodeURIComponent(`Halo ${viewingDbProfile.name}, Admin RuangSinggah. Konfirmasi pesanan database (${viewingDbProfile.id}) - ${viewingDbProfile.dbName}.`)}`, '_blank')} className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl text-sm font-bold transition-all flex justify-center items-center gap-2 shadow-sm">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.711.956 2.873.956 3.182 0 5.768-2.585 5.77-5.765.001-3.181-2.586-5.768-5.768-5.768zm3.333 8.33c-.15.424-.877.817-1.229.845-.306.024-.652.128-2.146-.464-1.801-.715-2.956-2.548-3.047-2.671-.09-.122-.727-.968-.727-1.844 0-.875.452-1.304.613-1.472.161-.168.351-.21.468-.21.117 0 .234.004.336.008.109.006.255-.044.398.303.151.365.518 1.264.565 1.356.046.091.077.198.016.321-.061.121-.092.197-.184.304-.092.107-.193.226-.275.319-.092.105-.188.22-.083.402.105.183.468.775 1.002 1.25.688.614 1.27.8 1.455.892.183.092.29.077.397-.038.106-.115.46-.537.583-.721.122-.184.244-.154.409-.092.165.061 1.042.492 1.221.583.179.092.298.138.341.214.043.076.043.447-.107.871z" /></svg>
                                Hubungi via WhatsApp
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {viewingDbProof && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setViewingDbProof(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-5 border-b border-gray-100"><div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Bukti Transfer</p><h3 className="text-base font-black text-gray-900 mt-0.5">{viewingDbProof.id} — {viewingDbProof.name}</h3></div><button onClick={() => setViewingDbProof(null)} className="p-2 rounded-xl hover:bg-gray-100"><svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button></div>
                        <div className="p-4"><img src={viewingDbProof.proofUrl} alt="Bukti Transfer" className="w-full rounded-xl border border-gray-100 object-cover max-h-80" /></div>
                        <div className="bg-yellow-50 border-t border-yellow-100 px-5 py-3 flex items-center gap-2"><span>⚠️</span><p className="text-xs text-yellow-800 font-medium">Verifikasi nominal sebelum menekan "Terima".</p></div>
                    </div>
                </div>
            )}
            {viewingDbInvoice && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setViewingDbInvoice(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="bg-gradient-to-r from-blue-700 to-blue-600 p-5 text-white">
                            <div className="flex justify-between items-start"><div><p className="text-xs font-black tracking-widest uppercase opacity-80">RuangSinggah.id — Database</p><h3 className="text-xl font-black mt-1">{viewingDbInvoice.invoiceId}</h3><p className="text-xs mt-1 opacity-70">Diterbitkan: {viewingDbInvoice.date}</p></div><span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-white/20">{viewingDbInvoice.status}</span></div>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                                <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pembeli</p><p className="font-bold text-gray-900">{viewingDbInvoice.name}</p></div>
                                <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Jenis Database</p><p className="font-bold text-gray-900">{viewingDbInvoice.dbType}</p></div>
                                <div className="col-span-2"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nama Database</p><p className="font-bold text-gray-900">{viewingDbInvoice.dbName}</p></div>
                            </div>
                            <div className="border-t border-dashed border-gray-200 pt-4 space-y-2">
                                <div className="flex justify-between text-sm"><span className="text-gray-600">Harga Database</span><span className="font-bold">{FORMAT_CURRENCY(viewingDbInvoice.amount || 0)}</span></div>
                                <div className="flex justify-between text-sm"><span className="text-gray-600">Biaya Platform</span><span className="font-bold">{FORMAT_CURRENCY(viewingDbInvoice.platformFee || 0)}</span></div>
                                <div className="flex justify-between text-sm font-black text-gray-900 border-t border-gray-100 pt-2"><span>Total Dibayar</span><span className="text-blue-600 text-base">{FORMAT_CURRENCY((viewingDbInvoice.amount || 0) + (viewingDbInvoice.platformFee || 0))}</span></div>
                            </div>
                            <div className={`rounded-xl p-3 flex gap-3 items-center ${viewingDbInvoice.paymentType === 'gateway' ? 'bg-blue-50 border border-blue-100' : 'bg-amber-50 border border-amber-100'}`}><span className="text-xl">{viewingDbInvoice.paymentType === 'gateway' ? '⚡' : '🏦'}</span><div><p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Metode</p><p className="font-bold text-gray-900 text-sm">{viewingDbInvoice.paymentMethod}</p></div></div>
                            <div className="flex gap-2 pt-1">
                                <button onClick={() => setViewingDbInvoice(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl text-xs font-bold">Tutup</button>
                                <button onClick={() => window.print()} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2.5 rounded-xl text-xs font-bold flex justify-center items-center gap-1.5 shadow-sm"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>Cetak</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    const renderVerifikasiRequests = () => {
        const filteredRequests = isAgent 
            ? surveyRequests.filter(req => {
                const s = req.status;
                if (agentTab === 'pending') return s === 'PENDING_ASSIGNMENT';
                if (agentTab === 'active') return ['AGENT_ASSIGNED', 'SURVEYING', 'RESCHEDULED'].includes(s);
                if (agentTab === 'history') return ['COMPLETED', 'CANCELLED'].includes(s);
                return false;
            })
            : isAdmin 
                ? surveyRequests.filter(req => {
                    if (adminSurveyTab === 'all') return true;
                    if (adminSurveyTab === 'pending') return req.status === 'PENDING_ASSIGNMENT';
                    if (adminSurveyTab === 'active') return ['AGENT_ASSIGNED', 'SURVEYING', 'RESCHEDULED'].includes(req.status);
                    if (adminSurveyTab === 'completed') return req.status === 'COMPLETED';
                    return true;
                })
                : surveyRequests;

        const stats = {
            total: surveyRequests.length,
            pending: surveyRequests.filter(r => r.status === 'PENDING_ASSIGNMENT').length,
            active: surveyRequests.filter(r => ['AGENT_ASSIGNED', 'SURVEYING', 'RESCHEDULED'].includes(r.status)).length,
            completed: surveyRequests.filter(r => r.status === 'COMPLETED').length,
            totalRevenue: surveyRequests.filter(r => r.status === 'COMPLETED').length * 150000 // Sample revenue per survey
        };

        return (
            <div className={`space-y-6 ${isAgent ? 'pb-32' : ''}`}>
                {/* ADMIN SUMMARY STATS */}
                {isAdmin && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-2">
                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Transaksi</p>
                            <div className="flex items-baseline gap-2">
                                <p className="text-xl font-black text-gray-900">{stats.total}</p>
                                <span className="text-[10px] font-bold text-gray-400">Order</span>
                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                            <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Menunggu Agen</p>
                            <p className="text-xl font-black text-amber-600">{stats.pending}</p>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                            <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-1">Sedang Berjalan</p>
                            <p className="text-xl font-black text-orange-600">{stats.active}</p>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-orange-100 shadow-sm">
                            <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-1">Total Pendapatan (Est)</p>
                            <div className="flex items-baseline gap-1">
                                <p className="text-xl font-black text-orange-600">Rp {(stats.completed * 150000).toLocaleString('id-ID')}</p>
                            </div>
                        </div>
                    </div>
                )}
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-2">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Permohonan Jasa Survey Kost</h2>
                        {isAdmin && filteredRequests.length > 0 && (
                            <div className="flex items-center gap-4 mt-2">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <div className="relative flex items-center justify-center">
                                        <input
                                            type="checkbox"
                                            className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-gray-300 checked:bg-orange-500 checked:border-orange-500 transition-all"
                                            checked={selectedSurveyIds.length === filteredRequests.length && filteredRequests.length > 0}
                                            onChange={(e) => {
                                                if (e.target.checked) setSelectedSurveyIds(filteredRequests.map(r => r.id));
                                                else setSelectedSurveyIds([]);
                                            }}
                                        />
                                        <svg className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:text-orange-600 transition-colors">Pilih Semua ({filteredRequests.length})</span>
                                </label>

                                {selectedSurveyIds.length > 0 && (
                                    <button 
                                        onClick={handleBulkDeleteSurveys}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all animate-in fade-in slide-in-from-left-2"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        Hapus Terpilih ({selectedSurveyIds.length})
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                    {isAdmin && (
                        <div className="flex gap-2">
                            <button onClick={() => setIsAddingManualVerif(true)} className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all active:scale-95 flex items-center gap-2 shrink-0">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                                Tambah Manual
                            </button>
                        </div>
                    )}
                </div>

                {/* ADMIN TABS */}
                {isAdmin && (
                    <div className="bg-white/80 backdrop-blur-md p-1.5 rounded-2xl border border-gray-100 flex gap-1 shadow-sm sticky top-0 z-10 transition-all overflow-x-auto no-scrollbar">
                        {[
                            { id: 'all', label: 'Semua', icon: '📋' },
                            { id: 'pending', label: 'Butuh Agen', icon: '⏳' },
                            { id: 'active', label: 'Proses', icon: '⚡' },
                            { id: 'completed', label: 'Selesai', icon: '✅' }
                        ].map((t) => (
                            <button
                                key={t.id}
                                onClick={() => setAdminSurveyTab(t.id as any)}
                                className={`flex-1 min-w-[100px] py-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                                    adminSurveyTab === t.id 
                                    ? 'bg-orange-600 text-white shadow-md scale-[1.02]' 
                                    : 'text-gray-500 hover:bg-gray-100'
                                }`}
                            >
                                <span>{t.icon}</span>
                                {t.label}
                                {surveyRequests.filter(r => {
                                    if (t.id === 'all') return true;
                                    if (t.id === 'pending') return r.status === 'PENDING_ASSIGNMENT';
                                    if (t.id === 'active') return ['AGENT_ASSIGNED', 'SURVEYING', 'RESCHEDULED'].includes(r.status);
                                    if (t.id === 'completed') return r.status === 'COMPLETED';
                                    return false;
                                }).length > 0 && (
                                    <span className={`w-2 h-2 rounded-full ${adminSurveyTab === t.id ? 'bg-white' : 'bg-red-500'}`} />
                                )}
                            </button>
                        ))}
                    </div>
                )}

                {/* AGENT TABS */}
                {isAgent && (
                    <div className="bg-white/80 backdrop-blur-md p-1.5 rounded-2xl border border-gray-100 flex gap-1 shadow-sm sticky top-0 z-10 transition-all">
                        {[
                            { id: 'pending', label: 'Permintaan', icon: '📥' },
                            { id: 'active', label: 'Aktif', icon: '⚡' },
                            { id: 'history', label: 'Riwayat', icon: '📜' }
                        ].map((t) => (
                            <button
                                key={t.id}
                                onClick={() => setAgentTab(t.id as any)}
                                className={`flex-1 py-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                                    agentTab === t.id 
                                    ? 'bg-orange-600 text-white shadow-md scale-[1.02]' 
                                    : 'text-gray-500 hover:bg-gray-100'
                                }`}
                            >
                                <span>{t.icon}</span>
                                {t.label}
                                {surveyRequests.filter(r => {
                                    if (t.id === 'pending') return r.status === 'PENDING_ASSIGNMENT';
                                    if (t.id === 'active') return ['AGENT_ASSIGNED', 'SURVEYING', 'RESCHEDULED'].includes(r.status);
                                    if (t.id === 'history') return ['COMPLETED', 'CANCELLED'].includes(r.status);
                                    return false;
                                }).length > 0 && (
                                    <span className={`w-2 h-2 rounded-full ${agentTab === t.id ? 'bg-white' : 'bg-red-500'}`} />
                                )}
                            </button>
                        ))}
                    </div>
                )}

                <div className="bg-orange-50/50 border border-orange-100 rounded-xl p-4 flex gap-3 mb-2">
                    <span className="text-orange-500 shrink-0">🔍</span>
                    <p className="text-xs text-orange-800 leading-relaxed font-medium">
                        {isAgent 
                            ? `Menampilkan ${filteredRequests.length} pesanan di tab ${agentTab === 'pending' ? 'Permintaan' : agentTab === 'active' ? 'Aktif' : 'Riwayat'}.` 
                            : 'Kelola seluruh permohonan jasa verifikasi lapangan yang diajukan oleh pengguna.'
                        }
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {filteredRequests.map((req: SurveyRequest) => (
                    <div key={req.id} className={`bg-white border rounded-2xl p-6 shadow-sm flex flex-col md:flex-row gap-6 hover:shadow-md transition-all relative overflow-hidden ${selectedSurveyIds.includes(req.id) ? 'border-orange-500 ring-1 ring-orange-500 bg-orange-50/10' : 'border-gray-100'}`}>
                        {isAdmin && (
                            <div className="absolute top-4 left-4 z-20">
                                <label className="relative flex items-center justify-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="peer h-5 w-5 appearance-none rounded-md border border-gray-300 bg-white checked:bg-orange-500 checked:border-orange-500 transition-all shadow-sm"
                                        checked={selectedSurveyIds.includes(req.id)}
                                        onChange={(e) => {
                                            if (e.target.checked) setSelectedSurveyIds([...selectedSurveyIds, req.id]);
                                            else setSelectedSurveyIds(selectedSurveyIds.filter(id => id !== req.id));
                                        }}
                                    />
                                    <svg className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>
                                </label>
                            </div>
                        )}
                        {(req.status === 'AGENT_ASSIGNED' || req.status === 'SURVEYING') && <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/10 rounded-bl-full"></div>}
                        <div className={`flex-1 space-y-4 relative z-10 ${isAdmin ? 'pl-8' : ''}`}>
                            <div className="flex flex-col sm:flex-row justify-between items-start border-b border-gray-50 pb-4 gap-3">
                                <div>
                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                        <span className="bg-orange-100 text-orange-700 font-bold px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-wider">#{req.id.slice(0,8)}</span>
                                        <span className="text-xs text-gray-400 font-medium">{new Date(req.created_at).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}</span>
                                        <div className="px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-orange-50 text-orange-600 border border-orange-100 italic">Survey Live</div>
                                    </div>
                                    <p className="font-bold text-gray-900 text-lg leading-tight mb-1">{req.kost_name}</p>
                                    <p className="text-xs text-gray-500 font-medium flex items-center gap-1.5">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                        {req.user?.name || 'User'}
                                    </p>
                                </div>
                                <div className="w-full sm:w-auto">
                                    <span className={`inline-flex w-full sm:w-auto justify-center px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-xl border shadow-sm
                                        ${req.status === 'AWAITING_PAYMENT' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 
                                          req.status === 'PENDING_ASSIGNMENT' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                                          req.status === 'AGENT_ASSIGNED' ? 'bg-orange-50 text-orange-700 border-orange-200' : 
                                          req.status === 'SURVEYING' ? 'bg-orange-600 text-white border-orange-600 animate-pulse' : 
                                          req.status === 'COMPLETED' ? 'bg-green-600 text-white border-green-600' : 
                                          req.status === 'RESCHEDULED' ? 'bg-amber-500 text-white border-amber-600 shadow-amber-100' : 
                                          'bg-red-50 text-red-700 border-red-200'}`}>
                                        {req.status === 'AWAITING_PAYMENT' ? 'Menunggu Bayar' : 
                                         req.status === 'PENDING_ASSIGNMENT' ? 'Menunggu Agen' : 
                                         req.status === 'AGENT_ASSIGNED' ? 'Tugas Baru' : 
                                         req.status === 'SURVEYING' ? 'Sedang Survey' : 
                                         req.status === 'COMPLETED' ? 'Selesai' : 
                                         req.status === 'RESCHEDULED' ? 'Jadwal Ulang' : 
                                         req.status}
                                    </span>
                                    {req.status === 'RESCHEDULED' && (
                                        <div className="mt-1 flex items-center justify-end gap-1 px-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                                            <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest">Update Jadwal</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 shrink-0 border border-gray-100 mt-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    </div>
                                    <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Lokasi Kost</p><p className="font-bold text-gray-900 text-xs sm:text-sm leading-relaxed">{req.kost_address}</p></div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 shrink-0 border border-gray-100 mt-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    </div>
                                    <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Jadwal Survey</p><p className="font-bold text-orange-700 text-xs sm:text-sm">{req.survey_date} · {req.survey_time}</p></div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 shrink-0 border border-gray-100 mt-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                    </div>
                                    <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Kontak Pemilik</p><p className="font-bold text-gray-900 text-xs sm:text-sm">{req.owner_phone}</p></div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500 shrink-0 border border-orange-100 mt-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Harga Transaksi</p>
                                        <p className="font-bold text-orange-700 text-xs sm:text-sm">
                                            {req.transaction?.amount ? `Rp ${req.transaction.amount.toLocaleString('id-ID')}` : 'Rp 150.000'}
                                        </p>
                                        <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter ${
                                            req.transaction?.status?.toLowerCase() === 'paid' 
                                            ? 'bg-green-100 text-green-700' 
                                            : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                            {req.transaction?.status || 'PENDING'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            {req.notes && (
                                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Catatan Pemesan</p>
                                    <p className="text-sm text-gray-700 italic">"{req.notes}"</p>
                                </div>
                            )}

                            {req.result_drive_link && (
                                <div className="bg-orange-50 rounded-xl p-3 border border-orange-100 flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-lg shadow-sm">📂</div>
                                        <div>
                                            <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest leading-none mb-1">Hasil Survey (Google Drive)</p>
                                            <p className="text-xs font-bold text-orange-700 truncate max-w-[200px]">{req.result_drive_link}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => window.open(req.result_drive_link, '_blank')} className="px-3 py-1.5 bg-orange-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-orange-700 transition-all">Buka Link</button>
                                </div>
                            )}

                            {req.status === 'RESCHEDULED' && (
                                <div className="bg-amber-50 rounded-xl p-3 border border-amber-100 flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-amber-500 shadow-sm shrink-0 mt-0.5">🗓️</div>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest leading-none mb-1">Permintaan Jadwal Ulang</p>
                                        <p className="text-xs text-amber-800 font-medium leading-relaxed italic">"{req.notes || 'User meminta perubahan jadwal survey sesuai kesepakatan baru.'}"</p>
                                    </div>
                                </div>
                            )}

                            {req.status === 'COMPLETED' && (req.user_rating || req.user_comment) && (
                                <div className="bg-yellow-50/50 rounded-xl p-3 border border-yellow-100 mt-2">
                                    <div className="flex justify-between items-center mb-1.5">
                                        <p className="text-[10px] font-black text-yellow-700 uppercase tracking-widest">Feedback & Rating User</p>
                                        <div className="flex text-yellow-500 text-[10px]">
                                            {[...Array(5)].map((_, i) => (
                                                <span key={i}>{i < (req.user_rating || 0) ? '★' : '☆'}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-700 italic font-medium px-1">"{req.user_comment || 'Tidak ada komentar.'}"</p>
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col gap-2.5 md:w-52 shrink-0 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6 relative z-10">
                            {isAdmin ? (
                                <>
                                    {req.status === 'PENDING_ASSIGNMENT' ? (
                                        <button 
                                            onClick={() => {
                                                setIsEditingSurvey(req);
                                                setSurveyForm({
                                                    status: req.status,
                                                    kost_name: req.kost_name,
                                                    kost_address: req.kost_address,
                                                    owner_phone: req.owner_phone,
                                                    assigned_agent_id: req.assigned_agent_id,
                                                    agent_name: req.agent_name,
                                                    agent_phone: req.agent_phone,
                                                    agent_photo_url: req.agent_photo_url,
                                                    result_drive_link: req.result_drive_link,
                                                    evaluation_summary: req.evaluation_summary || {},
                                                    user_rating: req.user_rating,
                                                    user_comment: req.user_comment
                                                });
                                            }} 
                                            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-sm active:scale-95 transition-all flex justify-center items-center gap-2"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m-3-3v3m6-3v3M9 13h4M9 17h4m-7-8h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2v-8a2 2 0 012-2z" /></svg>
                                            Tetapkan Agen
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={() => {
                                                setIsEditingSurvey(req);
                                                setSurveyForm({
                                                    status: req.status,
                                                    kost_name: req.kost_name,
                                                    kost_address: req.kost_address,
                                                    owner_phone: req.owner_phone,
                                                    assigned_agent_id: req.assigned_agent_id,
                                                    agent_name: req.agent_name,
                                                    agent_phone: req.agent_phone,
                                                    agent_photo_url: req.agent_photo_url,
                                                    result_drive_link: req.result_drive_link,
                                                    evaluation_summary: req.evaluation_summary || {},
                                                    user_rating: req.user_rating,
                                                    user_comment: req.user_comment
                                                });
                                            }} 
                                            className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-sm active:scale-95 transition-all flex justify-center items-center gap-2"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2.25 2.25 0 113.182 3.182L12.75 20.25 9 21l.75-3.75 11.25-11.25z" /></svg>
                                            Kelola Survey
                                        </button>
                                    )}
                                    
                                    <button onClick={() => window.open(`https://wa.me/${req.user?.phone}?text=${encodeURIComponent(`Halo ${req.user?.name}, Admin RuangSinggah. Konfirmasi pesanan Jasa Survey untuk kost ${req.kost_name}.`)}`, '_blank')} className="w-full bg-green-50 hover:bg-green-500 text-green-600 hover:text-white border border-green-200 py-2.5 rounded-xl text-xs font-bold transition-all flex justify-center items-center gap-1.5">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.711.956 2.873.956 3.182 0 5.768-2.585 5.77-5.765.001-3.181-2.586-5.768-5.768-5.768zm3.333 8.33c-.15.424-.877.817-1.229.845-.306.024-.652.128-2.146-.464-1.801-.715-2.956-2.548-3.047-2.671-.09-.122-.727-.968-.727-1.844 0-.875.452-1.304.613-1.472.161-.168.351-.21.468-.21.117 0 .234.004.336.008.109.006.255-.044.398.303.151.365.518 1.264.565 1.356.046.091.077.198.016.321-.061.121-.092.197-.184.304-.092.107-.193.226-.275.319-.092.105-.188.22-.083.402.105.183.468.775 1.002 1.25.688.614 1.27.8 1.455.892.183.092.29.077.397-.038.106-.115.46-.537.583-.721.122-.184.244-.154.409-.092.165.061 1.042.492 1.221.583.179.092.298.138.341.214.043.076.043.447-.107.871z" /></svg>
                                        Chat User
                                    </button>

                                    {req.agent_phone && (
                                        <button onClick={() => window.open(`https://wa.me/${req.agent_phone}?text=${encodeURIComponent(`Halo ${req.agent_name}, Admin RuangSinggah. Update untuk survey kost ${req.kost_name}.`)}`, '_blank')} className="w-full bg-orange-50 hover:bg-orange-500 text-orange-600 hover:text-white border border-orange-200 py-2.5 rounded-xl text-xs font-bold transition-all flex justify-center items-center gap-1.5">
                                            Chat Agen
                                        </button>
                                    )}

                                    <button 
                                        onClick={() => handleDeleteSurvey(req.id, req.kost_name)}
                                        className="w-full bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-100 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex justify-center items-center gap-1.5 mt-2"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        Hapus Permintaan
                                    </button>
                                </>
                            ) : isAgent ? (
                                <div className="flex flex-col gap-2.5">
                                     {agentTab === 'pending' && (
                                         <div className="flex gap-2">
                                             <button onClick={() => alert('Pesanan Diterima!')} className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-sm active:scale-95 transition-all">
                                                 Terima Kost
                                             </button>
                                             <button onClick={() => alert('Pesanan Ditolak')} className="flex-1 bg-red-50 hover:bg-red-500 text-red-600 hover:text-white border border-red-200 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all">
                                                 Tolak
                                             </button>
                                         </div>
                                     )}
                                     
                                     {agentTab === 'active' && (
                                         <>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button onClick={() => alert('Status: Menuju Lokasi')} className="bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-tight shadow-sm transition-all border-b-4 border-orange-700 active:border-b-0 active:translate-y-1">
                                                    🚗 Menuju Lokasi
                                                </button>
                                                <button onClick={() => alert('Status: Sedang Survey')} className="bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-tight shadow-sm transition-all border-b-4 border-orange-700 active:border-b-0 active:translate-y-1">
                                                    📷 Sedang Survey
                                                </button>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-2 mt-1">
                                                <button onClick={() => window.open(`https://wa.me/${req.user?.phone}?text=${encodeURIComponent(`Halo ${req.user?.name}, saya Arif agen survey RuangSinggah.`)}`, '_blank')} className="bg-green-50 hover:bg-green-500 text-green-600 hover:text-white border border-green-200 py-2.5 rounded-xl text-[10px] font-bold transition-all flex justify-center items-center gap-1">
                                                    💬 Chat User
                                                </button>
                                                <button onClick={() => window.open(`https://wa.me/${req.owner_phone}?text=${encodeURIComponent(`Halo Pemilik Kost, saya Arif agen survey RuangSinggah.`)}`, '_blank')} className="bg-orange-50 hover:bg-orange-500 text-orange-600 hover:text-white border border-orange-200 py-2.5 rounded-xl text-[10px] font-bold transition-all flex justify-center items-center gap-1">
                                                    🏢 Chat Pemilik
                                                </button>
                                            </div>

                                            <button 
                                                onClick={() => {
                                                    setIsReschedulingSurvey(req);
                                                    setNewSurveyDate(req.survey_date || '');
                                                    setNewSurveyTime(req.survey_time || '');
                                                }} 
                                                className="w-full bg-amber-500 hover:bg-amber-600 text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-tight shadow-sm transition-all"
                                            >
                                                🗓️ Reschedule Survey
                                            </button>

                                            <button 
                                                onClick={() => {
                                                    setIsEditingSurvey(req);
                                                    setSurveyForm({
                                                        status: 'COMPLETED',
                                                        kost_name: req.kost_name,
                                                        kost_address: req.kost_address,
                                                        owner_phone: req.owner_phone,
                                                        assigned_agent_id: req.assigned_agent_id,
                                                        agent_name: req.agent_name,
                                                        agent_phone: req.agent_phone,
                                                        agent_photo_url: req.agent_photo_url,
                                                        result_drive_link: req.result_drive_link,
                                                        evaluation_summary: req.evaluation_summary || {},
                                                        user_rating: req.user_rating,
                                                        user_comment: req.user_comment
                                                    });
                                                }} 
                                                className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-md animate-pulse active:scale-95 transition-all flex justify-center items-center gap-2"
                                            >
                                                🏁 Selesaikan Survey
                                            </button>
                                          </>
                                      )}
                                      
                                      {agentTab === 'history' && (
                                          <button 
                                             onClick={() => {
                                                 setIsEditingSurvey(req);
                                                 setSurveyForm({
                                                     status: req.status,
                                                     kost_name: req.kost_name,
                                                     kost_address: req.kost_address,
                                                     owner_phone: req.owner_phone,
                                                     assigned_agent_id: req.assigned_agent_id,
                                                     agent_name: req.agent_name,
                                                     agent_phone: req.agent_phone,
                                                     agent_photo_url: req.agent_photo_url,
                                                     result_drive_link: req.result_drive_link,
                                                     evaluation_summary: req.evaluation_summary || {},
                                                     user_rating: req.user_rating,
                                                     user_comment: req.user_comment
                                                 });
                                             }} 
                                             className="w-full bg-white hover:bg-orange-50 text-orange-600 border border-orange-200 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex justify-center items-center gap-2"
                                         >
                                             {req.evaluation_summary?.room_facilities ? '✅ Lihat Laporan' : '📝 Input Progress Survey'}
                                         </button>
                                     )}
                                </div>
                             ) : (
                                 <div className="flex flex-col gap-2.5">
                                     {req.status === 'COMPLETED' && (
                                         <>
                                             <button 
                                                 onClick={() => {
                                                     setIsEditingSurvey(req);
                                                     setSurveyForm({
                                                         status: req.status,
                                                         kost_name: req.kost_name,
                                                         kost_address: req.kost_address,
                                                         owner_phone: req.owner_phone,
                                                         assigned_agent_id: req.assigned_agent_id,
                                                         agent_name: req.agent_name,
                                                         agent_phone: req.agent_phone,
                                                         agent_photo_url: req.agent_photo_url,
                                                         result_drive_link: req.result_drive_link,
                                                         evaluation_summary: req.evaluation_summary || {},
                                                         user_rating: req.user_rating,
                                                         user_comment: req.user_comment
                                                     });
                                                 }} 
                                                 className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-md transition-all flex justify-center items-center gap-2"
                                             >
                                                 ✅ Lihat Laporan Survey
                                             </button>
                                             <button 
                                                 onClick={() => setUserRating(1)} // Trigger rating modal
                                                 className="w-full bg-yellow-50 hover:bg-yellow-400 text-yellow-700 hover:text-white border border-yellow-200 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                                             >
                                                 ⭐ Beri Rating Layanan
                                             </button>
                                         </>
                                     )}

                                     {(req.status === 'AGENT_ASSIGNED' || req.status === 'SURVEYING') && (
                                         <div className="bg-orange-50 p-3 rounded-xl border border-orange-100 mb-1">
                                             <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-1">Status Saat Ini</p>
                                             <p className="text-xs font-bold text-gray-700">
                                                 {req.status === 'AGENT_ASSIGNED' ? 'Agen telah ditugaskan & akan segera menghubungi Anda.' : 'Agen sedang melakukan pengecekan di lokasi.'}
                                             </p>
                                         </div>
                                     )}

                                     {req.agent_phone && (
                                         <button 
                                             onClick={() => window.open(`https://wa.me/${req.agent_phone}?text=${encodeURIComponent(`Halo ${req.agent_name}, saya User RuangSinggah yang pesan survey untuk kost ${req.kost_name}.`)}`, '_blank')} 
                                             className="w-full bg-green-50 hover:bg-green-500 text-green-600 hover:text-white border border-green-200 py-2.5 rounded-xl text-xs font-bold transition-all flex justify-center items-center gap-1.5"
                                         >
                                             <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.711.956 2.873.956 3.182 0 5.768-2.585 5.77-5.765.001-3.181-2.586-5.768-5.768-5.768zm3.333 8.33c-.15.424-.877.817-1.229.845-.306.024-.652.128-2.146-.464-1.801-.715-2.956-2.548-3.047-2.671-.09-.122-.727-.968-.727-1.844 0-.875.452-1.304.613-1.472.161-.168.351-.21.468-.21.117 0 .234.004.336.008.109.006.255-.044.398.303.151.365.518 1.264.565 1.356.046.091.077.198.016.321-.061.121-.092.197-.184.304-.092.107-.193.226-.275.319-.092.105-.188.22-.083.402.105.183.468.775 1.002 1.25.688.614 1.27.8 1.455.892.183.092.29.077.397-.038.106-.115.46-.537.583-.721.122-.184.244-.154.409-.092.165.061 1.042.492 1.221.583.179.092.298.138.341.214.043.076.043.447-.107.871z" /></svg>
                                             Hubungi Agen Survey
                                         </button>
                                     )}
                                 </div>
                             )}
                        </div>
                    </div>
                ))}
                {filteredRequests.length === 0 && (
                    <div className="bg-gray-50 rounded-2xl p-12 text-center border-2 border-dashed border-gray-200">
                        <p className="text-gray-500 font-bold">Belum ada permohonan survey di tab ini.</p>
                    </div>
                )}
                </div>
            </div>
        );
    };


    const renderAgentVerifications = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-2">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Verifikasi Identitas Agen</h2>
                    <p className="text-gray-500 text-sm mt-1">Total {agentVerifications.length} permintaan pending.</p>
                </div>
            </div>

            <div className="bg-orange-50/50 border border-orange-100 rounded-xl p-4 flex gap-3 mb-2">
                <span className="text-orange-500 shrink-0">🛡️</span>
                <p className="text-sm font-medium text-orange-900">Periksa kecocokan data NIK dan Nama dengan Foto KTP sebelum memberikan persetujuan.</p>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {agentVerifications.length === 0 ? (
                    <div className="bg-white border-2 border-dashed border-gray-100 rounded-3xl p-12 text-center">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">🏜️</div>
                        <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-2">Tidak Ada Antrian</h3>
                        <p className="text-gray-500 max-w-sm mx-auto font-medium">Semua pengajuan verifikasi agen telah diproses.</p>
                    </div>
                ) : agentVerifications.map((agent: any) => (
                    <div key={agent.id} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col lg:flex-row gap-8">
                        {/* KTP Photo Section */}
                        <div className="lg:w-72 shrink-0">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Foto KTP</p>
                            <div 
                                className="aspect-[3/2] rounded-xl border border-gray-100 overflow-hidden bg-gray-50 cursor-zoom-in group relative"
                                onClick={() => window.open(agent.ktp_photo_url, '_blank')}
                            >
                                {agent.ktp_photo_url ? (
                                    <>
                                        <img src={agent.ktp_photo_url} alt="KTP" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <span className="text-white text-xs font-bold uppercase tracking-widest">Klik Perbesar</span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                                        <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                        <span className="text-[10px] uppercase font-black">Tanpa Foto</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Details Section */}
                        <div className="flex-1 space-y-6">
                            <div className="flex justify-between items-start gap-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="bg-orange-100 text-orange-700 font-bold px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-wider">#{agent.id.slice(0,8)}</span>
                                        <span className="text-xs text-gray-400 font-medium">Diajukan: {new Date(agent.updated_at || agent.created_at).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'})}</span>
                                    </div>
                                    <h3 className="text-xl font-black text-gray-900">{agent.display_name || agent.name}</h3>
                                    <p className="text-sm font-medium text-gray-500 mt-1">E-mail: <span className="text-orange-600">{agent.email}</span></p>
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={async () => {
                                            if (window.confirm('Verifikasi identitas agen ini?')) {
                                                try {
                                                    await updateAgentVerificationStatus(agent.id, 'verified');
                                                    try {
                                                        await sendNotification(
                                                            agent.id,
                                                            'Akun Terverifikasi! 🛡️',
                                                            'Selamat! Identitas Anda telah diverifikasi. Anda sekarang bisa menerima orderan survey.',
                                                            'success',
                                                            {},
                                                            '/dashboard-agent'
                                                        );
                                                    } catch (notifErr) {
                                                        console.error('Notification failed:', notifErr);
                                                        alert('Verifikasi berhasil, namun gagal mengirim notifikasi ke agen. Harap periksa kebijakan RLS notifications Anda.');
                                                    }
                                                    loadAgentVerifications();
                                                } catch (err: any) {
                                                    console.error('Verification failed:', err);
                                                    alert('Gagal memproses verifikasi: ' + err.message);
                                                }
                                            }
                                        }}
                                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-sm active:scale-95 transition-all flex items-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                        Terima
                                    </button>
                                    <button 
                                        onClick={async () => {
                                            const reason = window.prompt('Alasan penolakan (opsional):');
                                            if (reason !== null) {
                                                try {
                                                    await updateAgentVerificationStatus(agent.id, 'rejected', reason);
                                                    try {
                                                        await sendNotification(
                                                            agent.id,
                                                            'Verifikasi Identitas Ditolak ⚠️',
                                                            `Maaf, pengajuan verifikasi Anda ditolak. Alasan: ${reason || 'Data tidak sesuai.'}. Silakan ajukan ulang dengan data yang benar.`,
                                                            'error',
                                                            {},
                                                            '/dashboard-agent'
                                                        );
                                                    } catch (notifErr) {
                                                        console.error('Notification failed:', notifErr);
                                                        alert('Status ditolak berhasil diperbarui, namun gagal mengirim notifikasi. Harap periksa kebijakan RLS notifications Anda.');
                                                    }
                                                    loadAgentVerifications();
                                                } catch (err: any) {
                                                    console.error('Rejection failed:', err);
                                                    alert('Gagal memproses penolakan: ' + err.message);
                                                }
                                            }
                                        }}
                                        className="bg-red-50 hover:bg-red-500 text-red-600 hover:text-white border border-red-200 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95"
                                    >
                                        Tolak
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-50">
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">No. NIK (KTP)</p>
                                    <p className="font-bold text-gray-900 bg-gray-50 px-4 py-2 rounded-lg border border-gray-100">{agent.ktp_number || 'TIDAK ADA'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">No. WhatsApp</p>
                                    <p className="font-bold text-gray-900 bg-gray-50 px-4 py-2 rounded-lg border border-gray-100">{agent.phone || 'TIDAK ADA'}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Alamat Sesuai KTP</p>
                                    <p className="font-bold text-gray-900 bg-gray-50 px-4 py-2 rounded-lg border border-gray-100 leading-relaxed text-sm">{agent.ktp_address || 'TIDAK ADA'}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Alamat Domisili Saat Ini</p>
                                    <p className="font-bold text-gray-900 bg-gray-50 px-4 py-2 rounded-lg border border-gray-100 leading-relaxed text-sm">{agent.address || 'TIDAK ADA'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderMitraRequests = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-2">
                <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Pendaftar Mitra</h2>
                <button onClick={() => setIsAddingManualMitra(true)} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all active:scale-95 flex items-center gap-2 shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                    Tambah Manual
                </button>
            </div>
            <div className="bg-orange-50/50 border border-orange-100 rounded-xl p-4 flex gap-3 mb-2">
                <span className="text-orange-500 shrink-0">🤝</span>
                <p className="text-sm font-medium text-orange-900">Daftar pendaftar yang ingin bergabung sebagai <strong>Mitra Pemilik Kost</strong>. Hubungi via WA untuk verifikasi dan onboarding.</p>
            </div>
            <div className="grid grid-cols-1 gap-4">
                {dummyMitra.map((mitra: any) => (
                    <div key={mitra.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row gap-4 hover:shadow-md transition-shadow">
                        <div className="flex-1">
                            <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="bg-orange-100 text-orange-700 font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">{mitra.id}</span>
                                        <span className="text-xs text-gray-400">{mitra.date}</span>
                                    </div>
                                    <p className="font-medium text-gray-500 text-sm">Nama: <span className="font-black text-gray-900 text-base">{mitra.name}</span></p>
                                </div>
                                <span className={`inline-flex px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-lg border ${mitra.status === 'Menunggu' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : mitra.status === 'Diproses' ? 'bg-blue-50 text-blue-700 border-blue-200' : mitra.status === 'Diterima' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>{mitra.status}</span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No. WA</p><p className="font-bold text-gray-900 text-sm mt-0.5">{mitra.phone}</p></div>
                                <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Kota</p><p className="font-bold text-gray-900 text-sm mt-0.5">{mitra.city}</p></div>
                                <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Jenis Bisnis</p><p className="font-bold text-gray-900 text-sm mt-0.5">{mitra.businessType}</p></div>
                                <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Jml. Properti</p><p className="font-bold text-orange-600 text-sm mt-0.5">{mitra.propertyCount} unit</p></div>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 sm:w-44 shrink-0 border-t sm:border-t-0 sm:border-l border-gray-100 pt-3 sm:pt-0 sm:pl-5 justify-center">
                            {(mitra.status === 'Menunggu' || mitra.status === 'Diproses') && (
                                <div className="grid grid-cols-2 gap-2">
                                    <button onClick={() => alert(`Mitra ${mitra.name} (${mitra.id}) diterima!`)} className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-xl text-xs font-bold active:scale-95 flex justify-center items-center gap-1">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Terima
                                    </button>
                                    <button onClick={() => { if (window.confirm(`Tolak pendaftaran ${mitra.name}?`)) alert('Ditolak.'); }} className="w-full bg-red-50 hover:bg-red-100 text-red-600 py-2 rounded-xl text-xs font-bold border border-red-200 active:scale-95 flex justify-center items-center gap-1">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>Tolak
                                    </button>
                                </div>
                            )}
                            <button onClick={() => window.open(`https://wa.me/${mitra.phone}?text=${encodeURIComponent(`Halo ${mitra.name}, kami dari Admin RuangSinggah.id. Terima kasih sudah mendaftar sebagai Mitra (${mitra.id}). Kami ingin melanjutkan proses verifikasi Anda. Apakah ada waktu untuk berdiskusi?`)}`, '_blank')} className="w-full bg-green-50 hover:bg-green-500 text-green-600 hover:text-white border border-green-200 py-2 rounded-xl text-xs font-bold transition-all flex justify-center items-center gap-1.5">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.711.956 2.873.956 3.182 0 5.768-2.585 5.77-5.765.001-3.181-2.586-5.768-5.768-5.768zm3.333 8.33c-.15.424-.877.817-1.229.845-.306.024-.652.128-2.146-.464-1.801-.715-2.956-2.548-3.047-2.671-.09-.122-.727-.968-.727-1.844 0-.875.452-1.304.613-1.472.161-.168.351-.21.468-.21.117 0 .234.004.336.008.109.006.255-.044.398.303.151.365.518 1.264.565 1.356.046.091.077.198.016.321-.061.121-.092.197-.184.304-.092.107-.193.226-.275.319-.092.105-.188.22-.083.402.105.183.468.775 1.002 1.25.688.614 1.27.8 1.455.892.183.092.29.077.397-.038.106-.115.46-.537.583-.721.122-.184.244-.154.409-.092.165.061 1.042.492 1.221.583.179.092.298.138.341.214.043.076.043.447-.107.871z" /></svg>
                                Follow Up WA
                            </button>
                        </div>
                    </div>
                ))}
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
                                onChange={(e) => setActiveMenu(e.target.value as DashboardMenu)}
                            >
                                <option value="analytics">📊 Ringkasan Analisis</option>
                                <option value="properties">🏠 Kelola Kost</option>
                                {isAdmin && <option value="verification">⚙️ Katalog Verifikasi</option>}
                                <option value="transactions_rent">🛒 Sewa Kost</option>
                                {isAdmin && <option value="transactions_db">📦 Pembelian DB</option>}
                                {isAdmin && <option value="verifikasi">✅ Verifikasi Kost (Order)</option>}
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
                                    verificationStatus={verificationStatus}
                                    surveyRequests={surveyRequests}
                                    loadSurveyRequests={loadSurveyRequests}
                                    onPageChange={onPageChange}
                                />
                            ) : (
                                <div className="admin-content-area">
                                    {activeMenu === 'analytics' && (isAdmin || isOwner) && renderAnalytics()}
                                    {activeMenu === 'agent_verification' && isAdmin && renderAgentVerifications()}
                                    
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
                                                                            <button onClick={() => window.open(`/?kostId=${item.id}`, '_blank')} className="px-3 py-1.5 rounded-lg text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors">Kunjungi</button>
                                                                            <button onClick={() => openEditModal(item)} className="px-3 py-1.5 rounded-lg text-xs font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 transition-colors">Edit</button>
                                                                            <button onClick={() => handleDelete(item.id, 'kost', item.title)} className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors">Hapus</button>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                            {displayListings.length === 0 && (
                                                                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400 font-medium">Belum ada data kost.</td></tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {activeMenu === 'databases' && isAdmin && (
                                        <>
                                            <div className="flex justify-end mb-4">
                                                <button
                                                    onClick={openAddDbModal}
                                                    className="bg-orange-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-orange-600 transition-all shadow-lg active:scale-95 flex items-center gap-2"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                                    Tambah Database
                                                </button>
                                            </div>
                                            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-left text-sm text-gray-500">
                                                        <thead className="bg-gray-50/50 text-xs font-black text-gray-500 uppercase tracking-widest">
                                                            <tr>
                                                                <th className="px-6 py-4">Info Database</th>
                                                                <th className="px-6 py-4">Kota/Area</th>
                                                                <th className="px-6 py-4">Harga</th>
                                                                <th className="px-6 py-4 text-right">Aksi</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-50">
                                                            {dbProducts.map(db => (
                                                                <tr key={db.id} className="hover:bg-gray-50/50 transition-colors">
                                                                    <td className="px-6 py-4">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500 shrink-0">
                                                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
                                                                            </div>
                                                                            <div>
                                                                                <p className="font-bold text-gray-900">{db.campus}</p>
                                                                                <p className="text-xs text-gray-400 mt-0.5">{db.totalData || '-'} Data</p>
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-6 py-4">
                                                                        <p className="font-medium text-gray-900">{db.city}</p>
                                                                        <p className="text-xs text-gray-400 mt-0.5">{db.area}</p>
                                                                    </td>
                                                                    <td className="px-6 py-4 font-bold text-gray-900">
                                                                        {FORMAT_CURRENCY(db.price)}
                                                                    </td>
                                                                    <td className="px-6 py-4">
                                                                        <div className="flex justify-end gap-2">
                                                                            <button onClick={() => openEditDbModal(db)} className="px-3 py-1.5 rounded-lg text-xs font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 transition-colors">Edit</button>
                                                                            <button onClick={() => handleDelete(db.id, 'database', db.campus)} className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors">Hapus</button>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                            {dbProducts.length === 0 && (
                                                                <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-400 font-medium">Belum ada data database.</td></tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {activeMenu === 'verification' && isAdmin && renderVerifikasi()}
                                    {activeMenu === 'transactions_rent' && renderRentTransactions()}
                                    {activeMenu === 'transactions_db' && isAdmin && renderDbTransactions()}
                                    {activeMenu === 'verifikasi' && isAdmin && renderVerifikasiRequests()}
                                    {activeMenu === 'mitra' && isAdmin && renderMitraRequests()}
                                    {activeMenu === 'complaints' && (isAdmin || isOwner) && renderComplaints()}
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

                {/* MODAL DATABASE FORM */}
                {isDbModalOpen && activeMenu === 'databases' && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm" onClick={() => setIsDbModalOpen(false)}></div>
                        <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl relative z-10 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                <h2 className="text-xl font-black uppercase">{editingDbId ? 'Edit Database' : 'Tambah Database'}</h2>
                                <button onClick={() => setIsDbModalOpen(false)}>&times;</button>
                            </div>
                            <form onSubmit={handleDbSubmit} className="flex-grow overflow-y-auto p-6 space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase">Nama Kampus</label>
                                        <input required className="w-full border rounded-xl px-4 py-3 font-bold" value={dbForm.campus} onChange={e => setDbForm({ ...dbForm, campus: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase">Estimasi Jumlah Data</label>
                                        <input required type="number" className="w-full border rounded-xl px-4 py-3 font-bold" value={dbForm.totalData} onChange={e => setDbForm({ ...dbForm, totalData: Number(e.target.value) })} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase">Kota</label>
                                        <input required className="w-full border rounded-xl px-4 py-3 font-bold" value={dbForm.city} onChange={e => setDbForm({ ...dbForm, city: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase">Area (Kecamatan/Daerah)</label>
                                        <input required className="w-full border rounded-xl px-4 py-3 font-bold" value={dbForm.area} onChange={e => setDbForm({ ...dbForm, area: e.target.value })} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase">Deskripsi</label>
                                    <textarea required className="w-full border rounded-xl px-4 py-3 font-medium" rows={3} value={dbForm.description} onChange={e => setDbForm({ ...dbForm, description: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase">Harga (IDR)</label>
                                    <input required type="number" className="w-full border rounded-xl px-4 py-3 font-bold" value={dbForm.price} onChange={e => setDbForm({ ...dbForm, price: Number(e.target.value) })} />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase">Cover Image</label>
                                    <input type="file" accept="image/*" onChange={e => setDbCoverFile(e.target.files ? e.target.files[0] : null)} className="w-full text-sm" />
                                    {dbForm.fileUrls?.coverImage?.original && <p className="text-xs text-green-500">Current: {dbForm.fileUrls.coverImage.original.substring(0, 30)}...</p>}
                                </div>

                                <div className="space-y-4 border-t pt-4">
                                    <label className="text-xs font-bold text-gray-400 uppercase">File Database</label>
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2">
                                            <input type="radio" name="fileType" checked={dbForm.fileType === 'link'} onChange={() => setDbForm({ ...dbForm, fileType: 'link' })} />
                                            <span className="text-sm font-bold">Link Google Drive</span>
                                        </label>
                                        <label className="flex items-center gap-2">
                                            <input type="radio" name="fileType" checked={dbForm.fileType === 'upload'} onChange={() => setDbForm({ ...dbForm, fileType: 'upload' })} />
                                            <span className="text-sm font-bold">Upload File (Excel/PDF)</span>
                                        </label>
                                    </div>

                                    {dbForm.fileType === 'link' ? (
                                        <input
                                            type="url"
                                            placeholder="https://drive.google.com/..."
                                            className="w-full border rounded-xl px-4 py-3 font-medium"
                                            value={dbForm.fileUrl}
                                            onChange={e => setDbForm({ ...dbForm, fileUrl: e.target.value })}
                                        />
                                    ) : (
                                        <div>
                                            <input type="file" accept=".xlsx,.xls,.pdf" onChange={e => setDbDocFile(e.target.files ? e.target.files[0] : null)} className="w-full text-sm" />
                                            {dbForm.fileName && <p className="text-xs text-green-500 mt-1">Current File: {dbForm.fileName}</p>}
                                        </div>
                                    )}
                                </div>
                            </form>
                            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
                                <button onClick={() => setIsDbModalOpen(false)} className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-white">Batal</button>
                                <button onClick={handleDbSubmit} disabled={isSubmitting} className="px-6 py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600">
                                    {isSubmitting ? 'Menyimpan...' : 'Simpan Database'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* MODAL MANUAL ADD RENT */}
                {isAddingManualRent && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm" onClick={() => setIsAddingManualRent(false)}></div>
                        <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl relative z-10 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <div>
                                    <h2 className="text-xl font-black uppercase text-gray-900">Tambah Sewa Manual</h2>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Catat transaksi di luar sistem</p>
                                </div>
                                <button onClick={() => setIsAddingManualRent(false)} className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-full text-gray-400 hover:text-gray-900 hover:border-gray-900 transition-colors">&times;</button>
                            </div>
                            <form onSubmit={handleManualRentSubmit} className="flex-grow overflow-y-auto p-6 space-y-5">
                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-black tracking-widest text-orange-500 uppercase border-b border-orange-100 pb-2">Informasi Penyewa</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label className="text-xs font-bold text-gray-500 uppercase">Nama Penyewa</label><input required className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm font-bold focus:bg-white focus:ring-2 focus:ring-orange-500/20 outline-none" value={manualRentForm.name || ''} onChange={e => setManualRentForm({ ...manualRentForm, name: e.target.value })} placeholder="Cth: Budi" /></div>
                                        <div><label className="text-xs font-bold text-gray-500 uppercase">WhatsApp</label><input required className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm font-bold focus:bg-white focus:ring-2 focus:ring-orange-500/20 outline-none" value={manualRentForm.phone || ''} onChange={e => setManualRentForm({ ...manualRentForm, phone: e.target.value })} placeholder="628..." /></div>
                                    </div>

                                    <h3 className="text-[10px] font-black tracking-widest text-orange-500 uppercase border-b border-orange-100 pb-2 pt-2">Detail Pemesanan Kost</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label className="text-xs font-bold text-gray-500 uppercase">Nama Kost</label><input required className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm font-bold focus:bg-white outline-none" value={manualRentForm.item || ''} onChange={e => setManualRentForm({ ...manualRentForm, item: e.target.value })} /></div>
                                        <div><label className="text-xs font-bold text-gray-500 uppercase">Tipe Kamar</label><input required className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm font-bold focus:bg-white outline-none" value={manualRentForm.roomType || ''} onChange={e => setManualRentForm({ ...manualRentForm, roomType: e.target.value })} /></div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase">Durasi</label>
                                            <select className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm font-bold focus:bg-white outline-none" value={manualRentForm.periodLabel || 'Bulanan'} onChange={e => setManualRentForm({ ...manualRentForm, periodLabel: e.target.value })}>
                                                <option value="Harian">Harian</option><option value="Mingguan">Mingguan</option><option value="Bulanan">Bulanan</option><option value="Tahunan">Tahunan</option>
                                            </select>
                                        </div>
                                        <div><label className="text-xs font-bold text-gray-500 uppercase">Harga Total (Rp)</label><input required type="number" className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm font-bold focus:bg-white outline-none" value={manualRentForm.amount || ''} onChange={e => setManualRentForm({ ...manualRentForm, amount: e.target.value })} /></div>
                                        <div><label className="text-xs font-bold text-gray-500 uppercase">Tgl Masuk</label><input type="date" required className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm font-bold focus:bg-white outline-none" value={manualRentForm.startDate || ''} onChange={e => setManualRentForm({ ...manualRentForm, startDate: e.target.value })} /></div>
                                        <div><label className="text-xs font-bold text-gray-500 uppercase">Tgl Keluar</label><input type="date" required className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm font-bold focus:bg-white outline-none" value={manualRentForm.endDate || ''} onChange={e => setManualRentForm({ ...manualRentForm, endDate: e.target.value })} /></div>
                                        <div className="col-span-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase">Status</label>
                                            <select className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm font-bold focus:bg-white outline-none" value={manualRentForm.status || 'Selesai'} onChange={e => setManualRentForm({ ...manualRentForm, status: e.target.value })}>
                                                <option value="Selesai">Selesai (Sudah Bayar & Masuk)</option>
                                                <option value="Menunggu">Menunggu Konfirmasi & Bayar</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <button type="submit" className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-black uppercase tracking-wider shadow-lg active:scale-95 transition-all mt-6">Simpan Transaksi Sewa</button>
                            </form>
                        </div>
                    </div>
                )}

                {/* MODAL MANUAL ADD DB PEMEBLIAN */}
                {isAddingManualDb && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm" onClick={() => setIsAddingManualDb(false)}></div>
                        <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl relative z-10 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <div><h2 className="text-xl font-black uppercase text-gray-900">Tambah Beli DB Manual</h2><p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Catat transaksi di luar sistem</p></div>
                                <button onClick={() => setIsAddingManualDb(false)} className="w-8 h-8 border rounded-full">&times;</button>
                            </div>
                            <form onSubmit={handleManualDbSubmit} className="flex-grow overflow-y-auto p-6 space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2"><label className="text-xs font-bold text-gray-500 uppercase">Nama Pembeli</label><input required className="w-full mt-1 bg-gray-50 border rounded-xl px-4 py-2 text-sm font-bold" value={manualDbForm.name || ''} onChange={e => setManualDbForm({ ...manualDbForm, name: e.target.value })} /></div>
                                    <div><label className="text-xs font-bold text-gray-500 uppercase">WhatsApp</label><input required className="w-full mt-1 bg-gray-50 border rounded-xl px-4 py-2 text-sm font-bold" value={manualDbForm.phone || ''} onChange={e => setManualDbForm({ ...manualDbForm, phone: e.target.value })} /></div>
                                    <div><label className="text-xs font-bold text-gray-500 uppercase">Email</label><input required type="email" className="w-full mt-1 bg-gray-50 border rounded-xl px-4 py-2 text-sm font-bold" value={manualDbForm.email || ''} onChange={e => setManualDbForm({ ...manualDbForm, email: e.target.value })} /></div>
                                    <div className="col-span-2"><label className="text-xs font-bold text-gray-500 uppercase">Judul Database</label><input required className="w-full mt-1 bg-gray-50 border rounded-xl px-4 py-2 text-sm font-bold" value={manualDbForm.dbName || ''} onChange={e => setManualDbForm({ ...manualDbForm, dbName: e.target.value })} /></div>
                                    <div><label className="text-xs font-bold text-gray-500 uppercase">Kategori / Tipe</label><input required className="w-full mt-1 bg-gray-50 border rounded-xl px-4 py-2 text-sm font-bold" value={manualDbForm.dbType || ''} onChange={e => setManualDbForm({ ...manualDbForm, dbType: e.target.value })} placeholder="Data Mahasiswa" /></div>
                                    <div><label className="text-xs font-bold text-gray-500 uppercase">Tahun</label><input required className="w-full mt-1 bg-gray-50 border rounded-xl px-4 py-2 text-sm font-bold" value={manualDbForm.dbYear || ''} onChange={e => setManualDbForm({ ...manualDbForm, dbYear: e.target.value })} placeholder="2025" /></div>
                                    <div><label className="text-xs font-bold text-gray-500 uppercase">Harga (Rp)</label><input required type="number" className="w-full mt-1 bg-gray-50 border rounded-xl px-4 py-2 text-sm font-bold" value={manualDbForm.amount || ''} onChange={e => setManualDbForm({ ...manualDbForm, amount: e.target.value })} /></div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase">Status</label>
                                        <select className="w-full mt-1 bg-gray-50 border rounded-xl px-4 py-2 text-sm font-bold" value={manualDbForm.status || 'Selesai'} onChange={e => setManualDbForm({ ...manualDbForm, status: e.target.value })}>
                                            <option value="Selesai">Selesai (Sudah Dikasih Akses)</option>
                                            <option value="Menunggu">Menunggu</option>
                                        </select>                                    </div>
                                </div>
                                <button type="submit" className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-black uppercase tracking-wider shadow-lg active:scale-95 transition-all mt-6">Simpan Transaksi DB</button>
                            </form>
                        </div>
                    </div>
                )}

                {/* MODAL EDIT SURVEY */}
                {isEditingSurvey && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm" onClick={() => setIsEditingSurvey(null)}></div>
                        <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl relative z-10 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-orange-50/50">
                                <div><h2 className="text-xl font-black uppercase text-orange-900">Kelola Survey</h2><p className="text-xs font-bold text-orange-500 uppercase tracking-widest mt-1">Update Status & Agen Surveyor</p></div>
                                <button onClick={() => setIsEditingSurvey(null)} className="w-8 h-8 flex items-center justify-center border rounded-full hover:bg-white transition-colors">&times;</button>
                            </div>
                            <form onSubmit={handleUpdateSurvey} className="flex-grow overflow-y-auto p-6 space-y-5">
                                <div className="space-y-4">
                                    {!isAgent && (
                                        <div>
                                            <div className="flex justify-between items-center">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Status Pesanan</label>
                                                {isAdmin && isEditingSurvey && (
                                                    <button 
                                                        type="button"
                                                        onClick={() => {
                                                            const phone = isEditingSurvey.user?.phone?.startsWith('+62') ? isEditingSurvey.user.phone.replace('+62', '62') : (isEditingSurvey.user?.phone?.startsWith('0') ? '62' + isEditingSurvey.user.phone.substring(1) : isEditingSurvey.user?.phone);
                                                            const msg = surveyForm.status === 'AGENT_ASSIGNED' 
                                                                ? `Halo%20${encodeURIComponent(isEditingSurvey.user?.name || '')},%20tim%20kami%20telah%20menugaskan%20agent%20untuk%20survey%20kost%20${encodeURIComponent(surveyForm.kost_name || '')}.%20Mohon%20tunggu%20update%20selanjutnya.`
                                                                : `Halo%20${encodeURIComponent(isEditingSurvey.user?.name || '')},%20update%20terbaru%20untuk%20survey%20kost%20${encodeURIComponent(surveyForm.kost_name || '')}:%20${surveyForm.status}.`;
                                                            window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
                                                        }}
                                                        className="text-[10px] font-black text-orange-600 hover:text-orange-700 flex items-center gap-1 uppercase tracking-widest"
                                                    >
                                                        <span>📱</span> Hubungi User
                                                    </button>
                                                )}
                                            </div>
                                            <div className="mt-1.5 p-4 bg-orange-50 border border-orange-100 rounded-xl flex items-center justify-between">
                                                <span className={`text-xs font-black uppercase tracking-widest ${
                                                    surveyForm.status === 'COMPLETED' ? 'text-green-600' : 
                                                    surveyForm.status === 'SURVEYING' ? 'text-orange-600 font-bold' :
                                                    surveyForm.status === 'RESCHEDULED' ? 'text-amber-600' :
                                                    'text-orange-600'
                                                }`}>
                                                    {surveyForm.status === 'PENDING_ASSIGNMENT' ? 'Menunggu Agen (Paid)' : 
                                                     surveyForm.status === 'AGENT_ASSIGNED' ? 'Agen Ditetapkan' :
                                                     surveyForm.status === 'SURVEYING' ? 'Sedang Survey' :
                                                     surveyForm.status === 'COMPLETED' ? 'Survey Selesai' :
                                                     surveyForm.status === 'AWAITING_PAYMENT' ? 'Menunggu Pembayaran' :
                                                     surveyForm.status === 'CANCELLED' ? 'Dibatalkan' :
                                                     surveyForm.status === 'RESCHEDULED' ? 'Penjadwalan Ulang' :
                                                     surveyForm.status}
                                                </span>
                                                <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
                                            </div>
                                            <p className="text-[10px] text-gray-400 mt-1 font-medium italic">* Status berubah otomatis saat agen ditetapkan atau survey selesai.</p>
                                        </div>
                                    )}

                                    {isAdmin && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="col-span-2">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pilih Agen Surveyor</label>
                                                <select 
                                                    className="w-full mt-1.5 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-orange-500 transition-all outline-none"
                                                    value={surveyForm.assigned_agent_id || ''}
                                                    onChange={e => {
                                                        const agentId = e.target.value;
                                                        const agent = surveyAgents.find(a => a.id === agentId);
                                                        if (agent) {
                                                            // Keep status PENDING_ASSIGNMENT even if agent is selected (Confirmation Flow)
                                                            const newStatus = surveyForm.status === 'AWAITING_PAYMENT' ? 'PENDING_ASSIGNMENT' : surveyForm.status;
                                                            setSurveyForm({ 
                                                                ...surveyForm, 
                                                                assigned_agent_id: agent.id, 
                                                                agent_name: agent.name, 
                                                                agent_phone: agent.phone,
                                                                agent_photo_url: agent.photo_url, 
                                                                status: newStatus 
                                                            });
                                                        } else {
                                                            setSurveyForm({ ...surveyForm, assigned_agent_id: null, agent_name: '', agent_phone: '', agent_photo_url: '' });
                                                        }
                                                    }}
                                                >
                                                    <option value="">-- Belum Ada Agen --</option>
                                                    {surveyAgents.map(a => (
                                                        <option key={a.id} value={a.id}>{a.name} (⭐ {a.rating || '0.0'}) - {a.phone}</option>
                                                    ))}
                                                </select>
                                                {surveyForm.assigned_agent_id && (
                                                    <div className="flex items-center justify-between mt-2">
                                                        <p className="text-[10px] text-gray-400 font-medium italic">Tugas ini akan muncul di dashboard agen <strong>{surveyForm.agent_name}</strong>.</p>
                                                        <button 
                                                            type="button"
                                                            onClick={() => {
                                                                const phone = surveyForm.agent_phone?.startsWith('+62') ? surveyForm.agent_phone.replace('+62', '62') : (surveyForm.agent_phone?.startsWith('0') ? '62' + surveyForm.agent_phone.substring(1) : surveyForm.agent_phone);
                                                                window.open(`https://wa.me/${phone}?text=Halo%20${encodeURIComponent(surveyForm.agent_name || '')},%20Anda%20mendapat%20tugas%20survey%20baru%20di%20${encodeURIComponent(surveyForm.kost_name || '')}.%20Mohon%20segera%20cek%20dashboard%20agen.%20Terima%20kasih.`, '_blank');
                                                            }}
                                                            className="text-[10px] font-black text-green-600 hover:text-green-700 flex items-center gap-1 uppercase tracking-widest"
                                                        >
                                                            <span>📱</span> Hubungi Agen
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                                        <div className="flex justify-between items-center mb-1.5">
                                            <label className="text-[10px] font-black text-blue-900 uppercase tracking-widest">Link Hasil Survey (Automated Drive)</label>
                                            {!surveyForm.result_drive_link && isAdmin && !isAgent && (
                                                <button 
                                                    type="button" 
                                                    onClick={handleGenerateDriveFolder}
                                                    className="text-[10px] font-black text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-lg shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
                                                    disabled={isSubmitting}
                                                >
                                                    {isSubmitting ? (
                                                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                    ) : '📂 Buat Folder Manual'}
                                                </button>
                                            )}
                                            {surveyForm.result_drive_link && (
                                                <button 
                                                    type="button" 
                                                    onClick={() => window.open(surveyForm.result_drive_link, '_blank')}
                                                    className="text-[10px] font-black text-blue-600 hover:text-blue-700 flex items-center gap-1 uppercase tracking-widest bg-white px-2 py-1 rounded-md border border-blue-200 shadow-sm transition-all active:scale-95"
                                                >
                                                    <span>📁</span> Buka Folder
                                                </button>
                                            )}
                                        </div>
                                        <input 
                                            readOnly
                                            className="w-full bg-white/80 border border-blue-200 rounded-xl px-4 py-3 text-xs font-bold text-blue-600 cursor-not-allowed outline-none"
                                            value={surveyForm.result_drive_link || ''}
                                            placeholder="Menunggu pembayaran/sistem menjana folder..."
                                        />
                                        <p className="text-[9px] text-blue-500 mt-2 font-medium italic">
                                            {surveyForm.result_drive_link 
                                                ? "✓ Folder Drive berhasil dibuat otomatis oleh sistem." 
                                                : "ℹ Folder akan dibuat otomatis segera setelah pembayaran terverifikasi."}
                                        </p>
                                    </div>


                                    {isAgent && (
                                        <div className="pt-4 border-t border-gray-100">
                                            <h3 className="text-xs font-black text-orange-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                                                Summary Penilaian Surveyor
                                            </h3>
                                        
                                        <div className="space-y-4">
                                             {/* WA Evidence Section */}
                                             <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 mb-6">
                                                 <label className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Bukti Screenshot WhatsApp (Evidence Video Call/Chat)</label>
                                                 <div className="mt-1.5 flex items-center gap-3">
                                                     <label className="flex-1 bg-white border border-dashed border-orange-200 rounded-xl px-4 py-3 text-[10px] font-bold text-orange-400 cursor-pointer hover:border-orange-400 hover:text-orange-600 transition-all flex items-center justify-center gap-2">
                                                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                         {(surveyForm.evaluation_summary as any)?.whatsapp_evidence_url ? 'Ganti SS WhatsApp' : 'Upload Screenshot WA'}
                                                         <input 
                                                             type="file" 
                                                             accept="image/*" 
                                                             className="hidden" 
                                                             onChange={(e) => {
                                                              if (!isAdmin && !isAgent) return;
                                                              alert('Upload SS WA (Dummy Mode)');
                                                           }} 
                                                           disabled={!isAdmin && !isAgent}
                                                         />
                                                     </label>
                                                     {(surveyForm.evaluation_summary as any)?.whatsapp_evidence_url && (
                                                         <div className="w-12 h-12 bg-white rounded-xl overflow-hidden border border-orange-200 flex-shrink-0">
                                                             <img src={(surveyForm.evaluation_summary as any).whatsapp_evidence_url} className="w-full h-full object-cover" alt="WA Evidence" />
                                                         </div>
                                                     )}
                                                 </div>
                                             </div>

                                             {[
                                                 { id: 'room_facilities', label: 'Fasilitas Kamar', icon: '🛏️' },
                                                 { id: 'bathroom_facilities', label: 'Fasilitas WC', icon: '🚿' },
                                                 { id: 'water_check', label: 'Pengecekan Air', icon: '💧' },
                                                 { id: 'wifi_check', label: 'Pengecekan WiFi', icon: '📶' },
                                                 { id: 'security_check', label: 'Pengecekan Keamanan', icon: '🛡️' },
                                                 { id: 'access_check', label: 'Akses Umum/Toko/Kampus', icon: '📍' },
                                                 { id: 'resident_testimonial', label: 'Testimoni Penghuni', icon: '💬' },
                                             ].map((field) => (
                                                 <div key={field.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm transition-all hover:border-orange-200">
                                                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                                                         <span>{field.icon}</span> {field.label}
                                                     </label>
                                                      <textarea 
                                                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-orange-500 transition-all outline-none mb-3"
                                                          rows={2}
                                                          value={(surveyForm.evaluation_summary as any)?.[field.id] || ''}
                                                          onChange={e => {
                                                              if (!isAdmin && !isAgent) return;
                                                              setSurveyForm({ 
                                                                  ...surveyForm, 
                                                                  evaluation_summary: { 
                                                                      ...(surveyForm.evaluation_summary || {}), 
                                                                      [field.id]: e.target.value 
                                                                  } 
                                                              });
                                                          }}
                                                          disabled={!isAdmin && !isAgent}
                                                          placeholder={(!isAdmin && !isAgent) ? 'Belum ada data' : `Tulis hasil pengecekan ${field.label.toLowerCase()}...`}
                                                      />
                                                     
                                                     {/* Photo Upload Section */}
                                                     <div className="space-y-2">
                                                         <div className="flex items-center justify-between">
                                                             <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Bukti Foto</span>
                                                              <label className={`text-[9px] font-black uppercase px-2.5 py-1.5 rounded-lg bg-orange-50 text-orange-600 transition-colors flex items-center gap-1.5 ${(!isAdmin && !isAgent) ? 'opacity-50 cursor-default' : 'cursor-pointer hover:bg-orange-100'} ${isUploadingSurveyPhoto === field.id ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                                                 {isUploadingSurveyPhoto === field.id ? (
                                                                     <>
                                                                         <div className="w-3 h-3 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                                                                         Uploading...
                                                                     </>
                                                                 ) : (
                                                                     <>
                                                                         <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                                                                         Tambah Foto
                                                                     </>
                                                                 )}
                                                                 <input 
                                                                     type="file" 
                                                                     multiple 
                                                                     accept="image/*" 
                                                                     className="hidden" 
                                                                     disabled={isUploadingSurveyPhoto === field.id}
                                                                     onChange={(e) => handleSurveyPhotoUpload(field.id, e.target.files)} 
                                                                 />
                                                             </label>
                                                         </div>
                                                         
                                                         {/* Photo Preview Grid */}
                                                         <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                                                             {((surveyForm.evaluation_summary as any)?.[`${field.id}_photos`] || []).map((url: string, idx: number) => (
                                                                 <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-gray-100 group shadow-sm bg-gray-50">
                                                                     <img src={url} alt="Proof" className="w-full h-full object-cover" />
                                                                     <button 
                                                                         type="button"
                                                                         onClick={() => handleRemoveSurveyPhoto(field.id, url)}
                                                                         className="absolute inset-0 bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-[2px]"
                                                                     >
                                                                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                                     </button>
                                                                 </div>
                                                             ))}
                                                         </div>
                                                     </div>
                                                 </div>
                                             ))}
                                         </div>
                                     </div>
                                 )}

                                 {isAdmin && surveyForm.status === 'COMPLETED' && (
                                     <div className="pt-4 border-t border-orange-100">
                                          <div className="bg-orange-50 p-5 rounded-2xl border border-orange-100">
                                             <div className="flex items-center gap-3 mb-4">
                                                 <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-lg">📝</div>
                                                 <div>
                                                     <h3 className="text-sm font-black text-orange-900 uppercase tracking-tight">Hasil Survey Selesai</h3>
                                                     <p className="text-[10px] text-orange-500 font-bold uppercase tracking-widest">Laporan Lengkap Agen</p>
                                                 </div>
                                             </div>
                                             <p className="text-xs text-orange-800 leading-relaxed mb-4 italic">"Survey telah diselesaikan oleh agen. Semua data fasilitas dan link dokumentasi telah terlampir."</p>
                                             <button 
                                                 type="button"
                                                 onClick={() => window.open(surveyForm.result_drive_link, '_blank')}
                                                 className="w-full bg-orange-500 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-md hover:bg-orange-600 transition-all flex items-center justify-center gap-2"
                                             >
                                                 📂 Buka Folder Dokumentasi
                                             </button>
                                          </div>
                                     </div>
                                 )}
                             </div>

                             <div className="flex gap-3 pt-4 p-6 border-t border-gray-100">
                                 <button 
                                     type="button"
                                     onClick={() => setIsEditingSurvey(null)}
                                     className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                                 >
                                     {(!isAdmin && !isAgent) ? 'Tutup' : 'Batal'}
                                 </button>
                                 {(isAdmin || isAgent) && (
                                     <button 
                                         type="submit" 
                                         disabled={isSubmitting}
                                         className="flex-[2] py-3.5 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-300 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                                     >
                                         {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                                     </button>
                                 )}
                             </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* MODAL MANUAL ADD VERIFIKASI KOST */}
                {isAddingManualVerif && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm" onClick={() => setIsAddingManualVerif(false)}></div>
                        <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl relative z-10 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <div><h2 className="text-xl font-black uppercase text-gray-900">Tambah Verifikasi Manual</h2><p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Catat jasa layanan surveyor</p></div>
                                <button onClick={() => setIsAddingManualVerif(false)} className="w-8 h-8 border rounded-full">&times;</button>
                            </div>
                            <form onSubmit={handleManualVerifSubmit} className="flex-grow overflow-y-auto p-6 space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2"><label className="text-xs font-bold text-gray-500 uppercase">Nama Pemesan</label><input required className="w-full mt-1 bg-gray-50 border rounded-xl px-4 py-2 text-sm font-bold" value={manualVerifForm.name || ''} onChange={e => setManualVerifForm({ ...manualVerifForm, name: e.target.value })} /></div>
                                    <div><label className="text-xs font-bold text-gray-500 uppercase">WhatsApp</label><input required className="w-full mt-1 bg-gray-50 border rounded-xl px-4 py-2 text-sm font-bold" value={manualVerifForm.phone || ''} onChange={e => setManualVerifForm({ ...manualVerifForm, phone: e.target.value })} /></div>
                                    <div><label className="text-xs font-bold text-gray-500 uppercase">Email</label><input required type="email" className="w-full mt-1 bg-gray-50 border rounded-xl px-4 py-2 text-sm font-bold" value={manualVerifForm.email || ''} onChange={e => setManualVerifForm({ ...manualVerifForm, email: e.target.value })} /></div>
                                    <div className="col-span-2"><label className="text-xs font-bold text-gray-500 uppercase">Nama Kost Dituju</label><input required className="w-full mt-1 bg-gray-50 border rounded-xl px-4 py-2 text-sm font-bold" value={manualVerifForm.kostName || ''} onChange={e => setManualVerifForm({ ...manualVerifForm, kostName: e.target.value })} /></div>
                                    <div><label className="text-xs font-bold text-gray-500 uppercase">Jadwal Survey</label><input type="date" required className="w-full mt-1 bg-gray-50 border rounded-xl px-4 py-2 text-sm font-bold" value={manualVerifForm.surveyDate || ''} onChange={e => setManualVerifForm({ ...manualVerifForm, surveyDate: e.target.value })} /></div>
                                    <div><label className="text-xs font-bold text-gray-500 uppercase">Jam (WIB)</label><input type="time" required className="w-full mt-1 bg-gray-50 border rounded-xl px-4 py-2 text-sm font-bold" value={manualVerifForm.surveyTime || ''} onChange={e => setManualVerifForm({ ...manualVerifForm, surveyTime: e.target.value })} /></div>
                                    <div><label className="text-xs font-bold text-gray-500 uppercase">Harga (Rp)</label><input required type="number" className="w-full mt-1 bg-gray-50 border rounded-xl px-4 py-2 text-sm font-bold" value={manualVerifForm.amount || ''} onChange={e => setManualVerifForm({ ...manualVerifForm, amount: e.target.value })} /></div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase">Status</label>
                                        <select className="w-full mt-1 bg-gray-50 border rounded-xl px-4 py-2 text-sm font-bold" value={manualVerifForm.status || 'Selesai'} onChange={e => setManualVerifForm({ ...manualVerifForm, status: e.target.value })}>
                                            <option value="Selesai">Selesai (Sudah Disurvey)</option>
                                            <option value="Dijadwalkan">Dijadwalkan</option>
                                            <option value="Menunggu">Menunggu</option>
                                        </select>
                                    </div>
                                </div>
                                <button 
                                    type="submit" 
                                    disabled={isSubmitting}
                                    className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-300 text-white rounded-xl text-sm font-black uppercase tracking-wider shadow-lg active:scale-95 transition-all mt-6"
                                >
                                    {isSubmitting ? 'Menyimpan...' : 'Simpan Data Survey'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* MODAL MANUAL ADD MITRA */}
                {isAddingManualMitra && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm" onClick={() => setIsAddingManualMitra(false)}></div>
                        <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl relative z-10 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <div><h2 className="text-xl font-black uppercase text-gray-900">Tambah Mitra Manual</h2><p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Catat pendaftaran mitra via offline/WA</p></div>
                                <button onClick={() => setIsAddingManualMitra(false)} className="w-8 h-8 border rounded-full">&times;</button>
                            </div>
                            <form onSubmit={handleManualMitraSubmit} className="flex-grow overflow-y-auto p-6 space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2"><label className="text-xs font-bold text-gray-500 uppercase">Nama Mitra Pemilik</label><input required className="w-full mt-1 bg-gray-50 border rounded-xl px-4 py-2 text-sm font-bold" value={manualMitraForm.name || ''} onChange={e => setManualMitraForm({ ...manualMitraForm, name: e.target.value })} /></div>
                                    <div><label className="text-xs font-bold text-gray-500 uppercase">WhatsApp</label><input required className="w-full mt-1 bg-gray-50 border rounded-xl px-4 py-2 text-sm font-bold" value={manualMitraForm.phone || ''} onChange={e => setManualMitraForm({ ...manualMitraForm, phone: e.target.value })} /></div>
                                    <div><label className="text-xs font-bold text-gray-500 uppercase">Kota Domisili</label><input required className="w-full mt-1 bg-gray-50 border rounded-xl px-4 py-2 text-sm font-bold" value={manualMitraForm.city || ''} onChange={e => setManualMitraForm({ ...manualMitraForm, city: e.target.value })} /></div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase">Kategori Bisnis</label>
                                        <select className="w-full mt-1 bg-gray-50 border rounded-xl px-4 py-2 text-sm font-bold" value={manualMitraForm.businessType || 'Kos-kosan'} onChange={e => setManualMitraForm({ ...manualMitraForm, businessType: e.target.value })}>
                                            <option value="Kos-kosan">Kos-kosan</option><option value="Apartemen">Apartemen</option><option value="Kontrakan">Kontrakan</option>
                                        </select>
                                    </div>
                                    <div><label className="text-xs font-bold text-gray-500 uppercase">Jml. Properti</label><input required type="number" className="w-full mt-1 bg-gray-50 border rounded-xl px-4 py-2 text-sm font-bold" value={manualMitraForm.propertyCount || ''} onChange={e => setManualMitraForm({ ...manualMitraForm, propertyCount: e.target.value })} /></div>
                                    <div className="col-span-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Status Mitra</label>
                                        <select className="w-full mt-1 bg-gray-50 border rounded-xl px-4 py-2 text-sm font-bold" value={manualMitraForm.status || 'Diterima'} onChange={e => setManualMitraForm({ ...manualMitraForm, status: e.target.value })}>
                                            <option value="Diterima">Diterima (Aktif)</option>
                                            <option value="Menunggu">Menunggu</option>
                                            <option value="Diproses">Diproses Hubungi WA</option>
                                        </select>
                                    </div>
                                </div>
                                <button 
                                    type="submit" 
                                    disabled={isSubmitting}
                                    className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white rounded-xl text-sm font-black uppercase tracking-wider shadow-lg active:scale-95 transition-all mt-6"
                                >
                                    {isSubmitting ? 'Menyimpan...' : 'Simpan Data Mitra'}
                                </button>
                            </form>
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

                {/* MODAL RESCHEDULE SURVEY */}
                {isReschedulingSurvey && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm" onClick={() => setIsReschedulingSurvey(null)}></div>
                        <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl relative z-10 p-8 animate-in zoom-in-95">
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                </div>
                                <h3 className="text-xl font-black uppercase text-gray-900">Jadwal Ulang</h3>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Ajukan Waktu Baru ke User</p>
                            </div>

                            <div className="space-y-4 mb-8">
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5 ml-1">Tanggal Baru</label>
                                    <input 
                                        type="date" 
                                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                                        value={newSurveyDate}
                                        onChange={e => setNewSurveyDate(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5 ml-1">Jam Baru (WIB)</label>
                                    <input 
                                        type="time" 
                                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                                        value={newSurveyTime}
                                        onChange={e => setNewSurveyTime(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <button 
                                    onClick={handleRequestReschedule}
                                    disabled={isSubmitting}
                                    className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-orange-100 active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Mengirim...' : 'Kirim Permintaan'}
                                </button>
                                <button 
                                    onClick={() => setIsReschedulingSurvey(null)}
                                    className="w-full py-3 text-gray-400 hover:text-gray-600 text-[10px] font-black uppercase tracking-widest transition-all"
                                >
                                    Batalkan
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* MODAL RATING USER (Feedback) */}
                {userRating > -1 && userRating !== 0 && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm" onClick={() => setUserRating(0)}></div>
                        <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl relative z-10 p-8 animate-in zoom-in-95 text-center">
                            <div className="w-20 h-20 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                            </div>
                            <h3 className="text-xl font-black uppercase text-gray-900 mb-2">Beri Nilai Survey</h3>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Bagaimana kualitas layanan agen kami?</p>

                            <div className="flex justify-center gap-2 mb-8">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <button 
                                        key={star} 
                                        onClick={() => setUserRating(star)}
                                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${userRating >= star ? 'bg-yellow-400 text-white' : 'bg-gray-100 text-gray-300'}`}
                                    >
                                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                    </button>
                                ))}
                            </div>

                            <textarea 
                                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-yellow-400 outline-none transition-all mb-6"
                                rows={3}
                                placeholder="Tulis masukan Anda (Opsional)..."
                                value={userComment}
                                onChange={e => setUserComment(e.target.value)}
                            />

                             <button 
                                 onClick={handleSubmitFeedback}
                                 disabled={isSubmitting || userRating === 0}
                                 className="w-full py-4 bg-gray-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all disabled:opacity-50"
                             >
                                 {isSubmitting ? 'Mengirim...' : 'Simpan Feedback'}
                             </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default Dashboard;
