import React, { useState, useEffect } from 'react';
import { FORMAT_CURRENCY } from '../../constants';
import { supabase } from '../../supabase';
import { 
    updateKostManagerRequest, 
    deleteKostManagerRequest, 
    getSurveyAgents,
    generateManualDriveFolder
} from '../../adminService';
import { 
    FolderOpen, 
    Building2, 
    Bed, 
    ShieldCheck, 
    Camera, 
    ChevronLeft, 
    ChevronRight, 
    Bath, 
    CookingPot, 
    ChevronUp, 
    ChevronDown,
    ParkingCircle,
    Sparkles,
    AlertCircle,
    Check,
    ZoomIn,
    Layers,
    MapPin,
    Navigation,
    ShieldAlert,
    DoorClosed,
    Lock,
    Users
} from 'lucide-react';

interface KostManagerManagementProps {
    isAdmin: boolean;
    refreshData: () => void;
    onNavigateToPortal?: () => void;
}

const KostManagerManagement: React.FC<KostManagerManagementProps> = ({
    isAdmin,
    refreshData,
    onNavigateToPortal
}) => {
    const [requests, setRequests] = useState<any[]>([]);
    const [agents, setAgents] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Dialog/Editing State
    const [editingRequest, setEditingRequest] = useState<any | null>(null);
    const [editForm, setEditForm] = useState<any>({});
    const [activeTab, setActiveTab] = useState<'ALL' | 'NEED_AGENT' | 'SURVEYING' | 'VERIFICATION' | 'ACTIVE'>('ALL');
    const [selectedMitra, setSelectedMitra] = useState<any | null>(null);
    const [isMitraModalOpen, setIsMitraModalOpen] = useState(false);
    const [assignAgentMap, setAssignAgentMap] = useState<{ [reqId: string]: string }>({});

    // Comprehensive Review Modal States
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [reviewRequest, setReviewRequest] = useState<any | null>(null);
    const [reviewProperty, setReviewProperty] = useState<any | null>(null);
    const [reviewSurvey, setReviewSurvey] = useState<any | null>(null);
    const [loadingReview, setLoadingReview] = useState(false);
    const [reviewActiveTab, setReviewActiveTab] = useState<'info' | 'rooms' | 'legal'>('info');
    const [photoCategoryFilter, setPhotoCategoryFilter] = useState<string>('ALL');
    const [lightboxPhoto, setLightboxPhoto] = useState<{ url: string; label?: string } | null>(null);
    // Carousel & Accordion States (3-tab modal)
    const [selectedHeroPhotoIndex, setSelectedHeroPhotoIndex] = useState(0);
    const [selectedIsolatedPhotoIndex, setSelectedIsolatedPhotoIndex] = useState(0);
    const [selectedRoomGalleryFilter, setSelectedRoomGalleryFilter] = useState<number | 'all'>('all');
    const [selectedRoomGalleryPhotoIndex, setSelectedRoomGalleryPhotoIndex] = useState(0);
    const [expandedRoomTypes, setExpandedRoomTypes] = useState<Record<number, boolean>>({});
    const [expandedStatusSections, setExpandedStatusSections] = useState<Record<string, boolean>>({});
    const [realtimeDistances, setRealtimeDistances] = useState<Record<string, { distance: string; duration: string; walkDuration: string; motoDuration: string; carDuration: string; rawKm: number; isLiveGoogleApi?: boolean }>>({});
    const [loadingDistances, setLoadingDistances] = useState(false);

    // Hitung Jarak & Durasi Real Google Maps (DistanceMatrixService & DirectionsService) dengan Cache-First (Write Once, Read Free)
    useEffect(() => {
        if (!reviewModalOpen || !reviewProperty) return;
        const campuses: any[] = reviewProperty?.campuses || [];
        if (campuses.length === 0) return;

        // 1. CEK CACHE: Jika data durasi sudah tersimpan di database, gunakan langsung (0 API Call / $0 Cost)
        const hasAllCachedDurations = campuses.every((c: any) => {
            return Boolean(c && typeof c === 'object' && c.walkDuration && c.motoDuration);
        });

        if (hasAllCachedDurations) {
            const cachedMap: Record<string, any> = {};
            campuses.forEach((c: any) => {
                const cName = typeof c === 'string' ? c : (c?.name || '');
                cachedMap[cName] = {
                    distance: c?.distance || '1.2 km',
                    duration: c?.motoDuration || c?.duration || '3 mnt',
                    walkDuration: c?.walkDuration || '17 mnt',
                    motoDuration: c?.motoDuration || '3 mnt',
                    carDuration: c?.carDuration || '5 mnt',
                    rawKm: 1.2,
                    isLiveGoogleApi: Boolean(c?.isLiveGoogleApi)
                };
            });
            setRealtimeDistances(cachedMap);
            setLoadingDistances(false);
            console.log('[GoogleMaps Cache] ✅ Menggunakan data durasi tersimpan dari database (0 API Call - $0 Cost)');
            return;
        }

        const kostLat = parseFloat(reviewProperty?.location?.lat || reviewProperty?.latitude || -5.147665);
        const kostLng = parseFloat(reviewProperty?.location?.lng || reviewProperty?.longitude || 119.432731);

        const KNOWN_COORDS: Record<string, { lat: number; lng: number }> = {
            'pnup': { lat: -5.1378, lng: 119.4905 },
            'politeknik negeri ujung pandang': { lat: -5.1378, lng: 119.4905 },
            'unhas': { lat: -5.1354, lng: 119.4883 },
            'universitas hasanuddin': { lat: -5.1354, lng: 119.4883 },
            'uim': { lat: -5.1386, lng: 119.4796 },
            'universitas islam makassar': { lat: -5.1386, lng: 119.4796 },
            'umi': { lat: -5.1394, lng: 119.4475 },
            'universitas muslim indonesia': { lat: -5.1394, lng: 119.4475 },
            'unm': { lat: -5.1764, lng: 119.4363 },
            'universitas negeri makassar': { lat: -5.1764, lng: 119.4363 },
            'mtos': { lat: -5.1395, lng: 119.4782 },
            'makassar town square': { lat: -5.1395, lng: 119.4782 },
            'mall panakkukang': { lat: -5.1568, lng: 119.4477 },
            'nipah mall': { lat: -5.1408, lng: 119.4502 },
            'trans studio mall': { lat: -5.1554, lng: 119.3957 },
            'stiem': { lat: -5.1612, lng: 119.4410 }
        };

        const calcHaversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
            const R = 6371; // km
            const dLat = (lat2 - lat1) * Math.PI / 180;
            const dLon = (lon2 - lon1) * Math.PI / 180;
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                      Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return R * c; // raw straight-line km
        };

        const calculateFallback = (cName: string, cLat?: number, cLng?: number, explicitDist?: string) => {
            let rawKm = 0;
            if (cLat && cLng) {
                rawKm = calcHaversine(kostLat, kostLng, cLat, cLng);
            } else {
                const lower = cName.toLowerCase();
                let foundCoord = null;
                for (const [k, coord] of Object.entries(KNOWN_COORDS)) {
                    if (lower.includes(k) || k.includes(lower)) {
                        foundCoord = coord;
                        break;
                    }
                }
                if (foundCoord) {
                    rawKm = calcHaversine(kostLat, kostLng, foundCoord.lat, foundCoord.lng);
                } else if (explicitDist) {
                    const match = explicitDist.match(/[\d.]+/);
                    if (match) rawKm = parseFloat(match[0]);
                }
            }

            if (rawKm === 0) rawKm = 0.8;

            // Rute jalan raya & gerbang perimeter kampus (detour faktor nyata)
            const isCampus = cName.toLowerCase().includes('unhas') || cName.toLowerCase().includes('pnup') || cName.toLowerCase().includes('kampus') || cName.toLowerCase().includes('universitas');
            const driveKm = rawKm * 1.35;
            const walkKm = isCampus ? rawKm * 2.0 : rawKm * 1.4; // Kampus berpagar/portal membutuhkan rute jalan kaki memutar ke gerbang utama

            const distStr = driveKm < 1 ? `${Math.round(driveKm * 1000)} m` : `${driveKm.toFixed(1)} km`;
            const walkMin = Math.max(1, Math.round((walkKm / 4.2) * 60)); // ~4.2 km/jam jalan kaki
            const motoMin = Math.max(1, Math.round((driveKm / 28) * 60) + 1); // ~28 km/jam motor + lampu
            const carMin = Math.max(2, Math.round((driveKm / 18) * 60) + 2); // ~18 km/jam mobil + traffic

            return {
                distance: distStr,
                duration: `${motoMin} mnt`,
                walkDuration: `${walkMin} mnt`,
                motoDuration: `${motoMin} mnt`,
                carDuration: `${carMin} mnt`,
                rawKm: driveKm,
                isLiveGoogleApi: false
            };
        };

        // Populate initial fallback immediately
        const initialMap: Record<string, any> = {};
        campuses.forEach((c: any) => {
            const cName = typeof c === 'string' ? c : (c?.name || '');
            initialMap[cName] = calculateFallback(cName, c?.lat, c?.lng, c?.distance);
        });
        setRealtimeDistances(initialMap);

        // Async Query Google Maps DistanceMatrixService & DirectionsService with Polling
        let attempts = 0;
        let isCancelled = false;

        const tryQueryGoogleMaps = () => {
            if (isCancelled) return;
            if (typeof window !== 'undefined' && (window as any).google?.maps) {
                setLoadingDistances(true);
                try {
                    const googleMaps = (window as any).google.maps;
                    const originPoint = new googleMaps.LatLng(kostLat, kostLng);

                    // Strategi 1: DistanceMatrixService
                    if (googleMaps.DistanceMatrixService) {
                        const service = new googleMaps.DistanceMatrixService();
                        const origins = [originPoint];
                        const destinations = campuses.map((c: any) => {
                            const cName = typeof c === 'string' ? c : (c?.name || '');
                            const cLat = typeof c === 'object' ? c?.lat : undefined;
                            const cLng = typeof c === 'object' ? c?.lng : undefined;
                            if (cLat && cLng) return new googleMaps.LatLng(Number(cLat), Number(cLng));
                            return `${cName}, Makassar, Sulawesi Selatan`;
                        });

                        const fetchMatrix = (mode: any) => {
                            return new Promise<{ status: string; response: any }>((resolve) => {
                                service.getDistanceMatrix(
                                    {
                                        origins: origins,
                                        destinations: destinations,
                                        travelMode: mode,
                                        unitSystem: googleMaps.UnitSystem.METRIC,
                                    },
                                    (response: any, status: any) => {
                                        resolve({ status, response });
                                    }
                                );
                            });
                        };

                        Promise.all([
                            fetchMatrix(googleMaps.TravelMode.DRIVING),
                            fetchMatrix(googleMaps.TravelMode.WALKING)
                        ]).then(([drivingRes, walkingRes]) => {
                            if (isCancelled) return;
                            setLoadingDistances(false);
                            const updatedMap: Record<string, any> = {};

                            const drivingElements = (drivingRes.status === 'OK' && drivingRes.response?.rows?.[0]?.elements) ? drivingRes.response.rows[0].elements : [];
                            const walkingElements = (walkingRes.status === 'OK' && walkingRes.response?.rows?.[0]?.elements) ? walkingRes.response.rows[0].elements : [];

                            let hasLiveSuccess = false;

                            campuses.forEach((c: any, idx: number) => {
                                const cName = typeof c === 'string' ? c : (c?.name || `landmark_${idx}`);
                                const dEl = drivingElements[idx];
                                const wEl = walkingElements[idx];

                                if (dEl && dEl.status === 'OK') {
                                    hasLiveSuccess = true;
                                    const distMeters = dEl.distance.value;
                                    const distKm = distMeters / 1000;
                                    const motoMin = Math.max(1, Math.round(dEl.duration.value / 60));
                                    const carMin = Math.max(1, Math.round(dEl.duration.value / 60));
                                    
                                    let walkStr = `${Math.max(1, Math.ceil((distKm / 4.2) * 60))} mnt`;
                                    if (wEl && wEl.status === 'OK') {
                                        walkStr = wEl.duration.text;
                                    }

                                    console.log(`[GoogleMaps Live API] ✅ Received for ${cName}:`, {
                                        distance: dEl.distance.text,
                                        walk: walkStr,
                                        moto: `${motoMin} mnt`,
                                        car: `${carMin} mnt`
                                    });

                                    updatedMap[cName] = {
                                        distance: dEl.distance.text,
                                        duration: dEl.duration.text,
                                        walkDuration: walkStr,
                                        motoDuration: `${motoMin} mnt`,
                                        carDuration: `${carMin} mnt`,
                                        rawKm: distKm,
                                        isLiveGoogleApi: true
                                    };
                                } else if (wEl && wEl.status === 'OK') {
                                    hasLiveSuccess = true;
                                    const distMeters = wEl.distance.value;
                                    const distKm = distMeters / 1000;
                                    const motoMin = Math.max(1, Math.ceil((distKm / 28) * 60) + 1);
                                    const carMin = Math.max(2, Math.ceil((distKm / 18) * 60) + 2);

                                    updatedMap[cName] = {
                                        distance: wEl.distance.text,
                                        duration: wEl.duration.text,
                                        walkDuration: wEl.duration.text,
                                        motoDuration: `${motoMin} mnt`,
                                        carDuration: `${carMin} mnt`,
                                        rawKm: distKm,
                                        isLiveGoogleApi: true
                                    };
                                } else {
                                    updatedMap[cName] = calculateFallback(cName, c?.lat, c?.lng, c?.distance);
                                }
                            });

                            if (hasLiveSuccess) {
                                setRealtimeDistances(updatedMap);

                                // Auto-Save ke database Supabase agar ke depannya 0 API call ($0 Cost)
                                const enrichedCampuses = campuses.map((c: any, idx: number) => {
                                    const cName = typeof c === 'string' ? c : (c?.name || `landmark_${idx}`);
                                    const distInfo = updatedMap[cName];
                                    if (distInfo) {
                                        return {
                                            ...(typeof c === 'object' ? c : { name: cName }),
                                            distance: distInfo.distance,
                                            walkDuration: distInfo.walkDuration,
                                            motoDuration: distInfo.motoDuration,
                                            carDuration: distInfo.carDuration,
                                            isLiveGoogleApi: Boolean(distInfo.isLiveGoogleApi)
                                        };
                                    }
                                    return c;
                                });

                                if (reviewProperty?.id) {
                                    supabase
                                        .from('properties')
                                        .update({ campuses: enrichedCampuses })
                                        .eq('id', reviewProperty.id)
                                        .then(() => {
                                            console.log('[GoogleMaps Auto-Save] ✅ Data durasi Google Maps disimpan permanen ke tabel properties');
                                        })
                                        .catch((e: any) => console.warn('[GoogleMaps Auto-Save] Warning:', e));
                                }

                                if (reviewRequest?.id) {
                                    const prevMeta = reviewRequest.metadata || {};
                                    supabase
                                        .from('kostmanager_requests')
                                        .update({ metadata: { ...prevMeta, campuses: enrichedCampuses } })
                                        .eq('id', reviewRequest.id)
                                        .then(() => {})
                                        .catch(() => {});
                                }
                            }
                        }).catch((err) => {
                            if (isCancelled) return;
                            setLoadingDistances(false);
                            console.warn('[DistanceMatrixService] Notice:', err);
                        });
                    }
                } catch (err) {
                    if (isCancelled) return;
                    setLoadingDistances(false);
                    console.warn('[GoogleMapsService] Error:', err);
                }
            } else if (attempts < 8) {
                attempts++;
                setTimeout(tryQueryGoogleMaps, 350);
            }
        };

        tryQueryGoogleMaps();

        return () => {
            isCancelled = true;
        };
    }, [reviewModalOpen, reviewProperty]);
    
    const loadData = async () => {
        setLoading(true);
        try {
            // Fetch requests
            const { data: reqData, error: reqErr } = await supabase
                .from('kostmanager_requests')
                .select(`
                    *,
                    user:user_id (
                        name,
                        email,
                        phone
                    ),
                    transaction:transaction_id (
                        amount,
                        status,
                        payment_method,
                        created_at,
                        metadata
                    )
                `)
                .order('created_at', { ascending: false });

            if (reqErr) throw reqErr;
            setRequests(reqData || []);

            // Fetch agents
            const surveyAgents = await getSurveyAgents();
            setAgents(surveyAgents || []);
        } catch (err) {
            console.error('Error loading KostManager requests:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Open Comprehensive Review Modal and load all connected property & survey assets
    const openReviewModal = async (req: any) => {
        setReviewRequest(req);
        setReviewModalOpen(true);
        setLoadingReview(true);
        setReviewActiveTab('info');
        setPhotoCategoryFilter('ALL');
        setSelectedHeroPhotoIndex(0);
        setSelectedIsolatedPhotoIndex(0);
        setSelectedRoomGalleryFilter('all');
        setSelectedRoomGalleryPhotoIndex(0);
        setExpandedRoomTypes({});
        setExpandedStatusSections({});
        try {
            let propData: any = null;
            // 1. Fetch from properties by property_id
            if (req.property_id) {
                const { data } = await supabase.from('properties').select('*').eq('id', req.property_id).maybeSingle();
                if (data) propData = data;
            }
            // 2. Fetch from properties by transaction metadata
            if (!propData && req.transaction?.metadata?.propertyId) {
                const { data } = await supabase.from('properties').select('*').eq('id', req.transaction.metadata.propertyId).maybeSingle();
                if (data) propData = data;
            }
            // 3. Fallback to properties by owner_uid / user_id
            if (!propData && req.user_id) {
                const { data } = await supabase.from('properties').select('*').eq('owner_uid', req.user_id).order('created_at', { ascending: false }).limit(1).maybeSingle();
                if (data) propData = data;
            }
            // 4. Fallback from dedicated mitra_kostmanager table
            if (!propData && req.property_id) {
                const { data } = await supabase.from('mitra_kostmanager').select('*').eq('property_id', req.property_id).maybeSingle();
                if (data) propData = data;
            }
            setReviewProperty(propData);

            // Fetch survey metadata (signature, drive link, etc.) from kostmanager_surveys and fallback to survey_requests
            let survData: any = null;
            const { data: kmSurv } = await supabase
                .from('kostmanager_surveys')
                .select('*')
                .or(`kostmanager_request_id.eq.${req.id},id.eq.${req.id}`)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (kmSurv) {
                survData = kmSurv;
            } else if (req.transaction_id) {
                const { data: sReq } = await supabase
                    .from('survey_requests')
                    .select('signature_data, result_drive_link, status, created_at')
                    .eq('transaction_id', req.transaction_id)
                    .maybeSingle();
                if (sReq) survData = sReq;
            }

            // Also check properties / metadata for signature fallback
            if (!survData?.signature_data && (propData?.metadata?.signature_data || req.signature_data)) {
                survData = {
                    ...(survData || {}),
                    signature_data: propData?.metadata?.signature_data || req.signature_data
                };
            }

            setReviewSurvey(survData || null);
        } catch (err) {
            console.error("Error loading review details:", err);
        } finally {
            setLoadingReview(false);
        }
    };

    // Approve and Activate Auto-Pilot service
    const handleApproveAndActivate = async (req: any, prop: any) => {
        if (!window.confirm(`Setujui seluruh hasil pendataan dan aktifkan layanan Auto-Pilot untuk "${req.kost_name}" sekarang?\n\nProperti akan langsung berstatus AKTIF dan tayang di platform pencarian.`)) return;
        setIsSubmitting(true);
        try {
            // 1. Update kostmanager_requests to ACTIVE
            await supabase.from('kostmanager_requests')
                .update({ 
                    status: 'ACTIVE',
                    updated_at: new Date().toISOString()
                })
                .eq('id', req.id);

            // 2. Update properties to active & is_managed = true
            const propId = prop?.id || req.property_id;
            if (propId) {
                await supabase.from('properties')
                    .update({ 
                        status: 'active',
                        is_managed: true,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', propId);
            }

            // 3. Update kostmanager_surveys to COMPLETED
            await supabase.from('kostmanager_surveys')
                .update({ 
                    status: 'COMPLETED',
                    updated_at: new Date().toISOString()
                })
                .eq('kostmanager_request_id', req.id);

            // 4. Update survey_requests to COMPLETED if any
            if (req.transaction_id) {
                await supabase.from('survey_requests')
                    .update({ status: 'COMPLETED', updated_at: new Date().toISOString() })
                    .eq('transaction_id', req.transaction_id);
            }

            alert(`✅ Layanan KostManager untuk "${req.kost_name}" berhasil diaktifkan sepenuhnya (ACTIVE)!`);
            setReviewModalOpen(false);
            await loadData();
            refreshData();
        } catch (err) {
            console.error('Error activating KostManager:', err);
            alert('Gagal mengaktifkan layanan: ' + (err as Error).message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateStatusAndAgent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingRequest) return;
        setIsSubmitting(true);
        try {
            // Determine automatic status
            let computedStatus = editingRequest.status;
            
            if (!editForm.assigned_agent_id) {
                computedStatus = 'PENDING_ASSIGNMENT';
            } else {
                if (computedStatus === 'PENDING_ASSIGNMENT') {
                    computedStatus = 'PENDING_ASSIGNMENT';
                }
                if (editForm.result_drive_link) {
                    computedStatus = 'PENDING_ONBOARDING';
                } else if (computedStatus === 'PENDING_ONBOARDING') {
                    computedStatus = 'AGENT_ASSIGNED';
                }
            }

            const updates: any = {
                status: computedStatus,
                assigned_agent_id: editForm.assigned_agent_id || null,
                result_drive_link: editForm.result_drive_link || null
            };

            if (editForm.assigned_agent_id) {
                const selectedAgent = agents.find(a => a.id === editForm.assigned_agent_id);
                if (selectedAgent) {
                    updates.agent_name = selectedAgent.name;
                    updates.agent_phone = selectedAgent.phone;
                }
            } else {
                updates.agent_name = null;
                updates.agent_phone = null;
            }

            await updateKostManagerRequest(editingRequest.id, updates);
            alert('Permintaan KostManager berhasil diperbarui.');
            setEditingRequest(null);
            loadData();
            refreshData();
        } catch (err) {
            console.error(err);
            alert('Gagal memperbarui data.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!window.confirm(`Apakah Anda yakin ingin menghapus permintaan KostManager untuk "${name}"?`)) return;
        setIsSubmitting(true);
        try {
            await deleteKostManagerRequest(id);
            alert('Permintaan berhasil dihapus.');
            loadData();
            refreshData();
        } catch (err) {
            console.error(err);
            alert('Gagal menghapus permintaan.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PENDING_ASSIGNMENT':
                return 'bg-amber-100 text-amber-900 border-amber-300 font-bold';
            case 'AGENT_ASSIGNED':
                return 'bg-blue-100 text-blue-900 border-blue-300 font-bold';
            case 'SURVEYING':
                return 'bg-purple-100 text-purple-900 border-purple-300 font-bold';
            case 'PENDING_ONBOARDING':
            case 'SUBMITTED':
                return 'bg-emerald-100 text-emerald-950 border-emerald-300 font-bold';
            case 'ACTIVE':
                return 'bg-green-100 text-green-900 border-green-300 font-bold';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'PENDING_ASSIGNMENT': return 'Menunggu Agen';
            case 'AGENT_ASSIGNED': return 'Agen Ditugaskan';
            case 'SURVEYING': return 'Sedang Disurvey';
            case 'PENDING_ONBOARDING':
            case 'SUBMITTED': return 'Menunggu Onboarding Admin';
            case 'ACTIVE': return 'Aktif (Auto-Pilot)';
            default: return status;
        }
    };

    const handleAssignAgentInline = async (reqId: string, agentId: string) => {
        if (!agentId) return alert('Silakan pilih agen terlebih dahulu.');
        const selectedAgent = agents.find(a => a.id === agentId);
        if (!selectedAgent) return;
        
        setIsSubmitting(true);
        try {
            const updates = {
                status: 'AGENT_ASSIGNED',
                assigned_agent_id: agentId,
                agent_name: selectedAgent.name,
                agent_phone: selectedAgent.phone
            };
            await updateKostManagerRequest(reqId, updates);
            alert('Agen berhasil ditugaskan.');
            loadData();
            refreshData();
        } catch (err) {
            console.error(err);
            alert('Gagal menugaskan agen.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredRequests = requests.filter(req => {
        if (activeTab === 'ALL') return true;
        if (activeTab === 'NEED_AGENT') return req.status === 'PENDING_ASSIGNMENT';
        if (activeTab === 'SURVEYING') return req.status === 'AGENT_ASSIGNED' || req.status === 'SURVEYING';
        if (activeTab === 'VERIFICATION') return req.status === 'PENDING_ONBOARDING' || req.status === 'SUBMITTED';
        if (activeTab === 'ACTIVE') return req.status === 'ACTIVE';
        return true;
    });

    const totalAll = requests.length;
    const totalNeedAgent = requests.filter(r => r.status === 'PENDING_ASSIGNMENT').length;
    const totalSurveying = requests.filter(r => r.status === 'AGENT_ASSIGNED' || r.status === 'SURVEYING').length;
    const totalVerification = requests.filter(r => r.status === 'PENDING_ONBOARDING' || r.status === 'SUBMITTED').length;
    const totalActive = requests.filter(r => r.status === 'ACTIVE').length;

    // Helper for photos array
    const normalizePhotos = (imgUrls: any[]) => {
        if (!imgUrls || !Array.isArray(imgUrls)) return [];
        return imgUrls.map((img: any, idx: number) => {
            if (typeof img === 'string') {
                return { url: img, label: `Foto ${idx + 1}` };
            }
            return {
                url: img?.original || img?.url || '',
                label: img?.label || `Foto ${idx + 1}`
            };
        }).filter(item => Boolean(item.url));
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">KostManager Auto-Pilot</h2>
                    <p className="text-gray-500 text-sm mt-1">Kelola permohonan langganan KostManager, verifikasi hasil pendataan survey, dan aktivasi layanan.</p>
                </div>
                {onNavigateToPortal && (
                    <button
                        onClick={onNavigateToPortal}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider shadow-md transition-all active:scale-95 flex items-center gap-2 shrink-0"
                    >
                        📊 Buka Portal Operasional KostManager
                    </button>
                )}
            </div>

            {/* Pipeline Tabs Status Filter */}
            <div className="flex flex-wrap gap-2 border-b border-gray-100 pb-4">
                {[
                    { key: 'ALL', label: 'Semua Permohonan', count: totalAll, color: 'bg-gray-100 text-gray-800' },
                    { key: 'NEED_AGENT', label: '🔴 Butuh Agen', count: totalNeedAgent, color: 'bg-amber-100 text-amber-800' },
                    { key: 'SURVEYING', label: '⚡ Proses Survey', count: totalSurveying, color: 'bg-blue-100 text-blue-800' },
                    { key: 'VERIFICATION', label: '📥 Butuh Verifikasi / Review', count: totalVerification, color: 'bg-emerald-100 text-emerald-900 font-bold' },
                    { key: 'ACTIVE', label: '🟢 Aktif Autopilot', count: totalActive, color: 'bg-green-100 text-green-800' }
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key as any)}
                        type="button"
                        className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 border ${
                            activeTab === tab.key
                                ? 'bg-gray-900 text-white border-gray-900 shadow-md shadow-gray-900/10'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                        }`}
                    >
                        <span>{tab.label}</span>
                        <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${tab.color}`}>
                            {tab.count}
                        </span>
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="text-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500 mx-auto"></div>
                </div>
            ) : (
                <div className="space-y-6">
                    {filteredRequests.length === 0 ? (
                        <div className="bg-white border border-gray-100 rounded-3xl p-12 text-center text-gray-400 font-bold uppercase tracking-wider text-xs">
                            Tidak ada permohonan dalam kategori ini.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredRequests.map(req => {
                                const isReadyForReview = req.status === 'PENDING_ONBOARDING' || req.status === 'SUBMITTED';

                                // Extract coordinates from notes or metadata
                                const extractCoords = (text: string) => {
                                    if (!text) return null;
                                    const match = text.match(/(-?\d+\.\d+),\s*(-?\d+\.\d+)/);
                                    if (match) return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
                                    const gmapsUrl = text.match(/https?:\/\/[^\s]+/);
                                    if (gmapsUrl) {
                                        const urlMatch = gmapsUrl[0].match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) || gmapsUrl[0].match(/q=(-?\d+\.\d+),(-?\d+\.\d+)/);
                                        if (urlMatch) return { lat: parseFloat(urlMatch[1]), lng: parseFloat(urlMatch[2]) };
                                    }
                                    return null;
                                };
                                const coords = extractCoords(req.notes) || (req.transaction?.metadata?.latitude && req.transaction?.metadata?.longitude ? { lat: req.transaction.metadata.latitude, lng: req.transaction.metadata.longitude } : null);

                                return (
                                    <div 
                                        key={req.id} 
                                        className={`bg-white rounded-3xl p-6 flex flex-col justify-between transition-all ${
                                            isReadyForReview 
                                                ? 'border-2 border-emerald-300 shadow-md ring-4 ring-emerald-500/10 bg-gradient-to-b from-emerald-50/20 via-white to-white' 
                                                : 'border border-gray-150 shadow-soft hover:shadow-md'
                                        }`}
                                    >
                                        <div>
                                            {/* Profil Mitra Pengaju (Interactive Header) */}
                                            <div className="flex items-center gap-3 pb-4 border-b border-gray-100 mb-4">
                                                <div 
                                                    onClick={() => {
                                                        setSelectedMitra(req.user || { name: 'Mitra', phone: req.owner_phone || '-' });
                                                        setIsMitraModalOpen(true);
                                                    }}
                                                    className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-black text-sm uppercase cursor-pointer hover:bg-orange-200 transition-all shadow-sm"
                                                >
                                                    {(req.user?.name || req.user?.email || 'M').charAt(0)}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <span 
                                                        onClick={() => {
                                                            setSelectedMitra(req.user || { name: 'Mitra', phone: req.owner_phone || '-' });
                                                            setIsMitraModalOpen(true);
                                                        }}
                                                        className="text-xs font-black text-gray-900 uppercase tracking-tight hover:text-orange-600 cursor-pointer block truncate"
                                                    >
                                                        {req.user?.name || 'Mitra Pengaju'}
                                                    </span>
                                                    <a 
                                                        href={`https://wa.me/${(req.user?.phone || req.owner_phone || '').replace(/[^0-9]/g, '')}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-[10px] text-gray-500 font-bold block hover:text-orange-500 transition-colors"
                                                    >
                                                        📞 {req.user?.phone || req.owner_phone || '-'}
                                                    </a>
                                                </div>
                                                <span className={`ml-auto px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border shadow-xs ${getStatusBadge(req.status)}`}>
                                                    {getStatusLabel(req.status)}
                                                </span>
                                            </div>

                                            {/* Detail Properti */}
                                            <div className="space-y-2.5">
                                                <h3 className="text-base font-black text-gray-900 uppercase tracking-tight leading-tight">{req.kost_name}</h3>
                                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider flex items-center gap-1.5">
                                                    <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700">{req.kost_type || 'Campur'}</span>
                                                    <span>•</span>
                                                    <span>Kamar: {req.transaction?.metadata?.totalRooms || req.transaction?.metadata?.total_rooms || '-'} Total / {req.empty_rooms || 0} Kosong</span>
                                                </p>
                                                <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">{req.kost_address}</p>

                                                {/* Maps Mini Iframe Embed */}
                                                {coords && (
                                                    <div className="w-full h-28 rounded-2xl overflow-hidden border border-gray-150 relative mt-2 shadow-inner">
                                                        <iframe
                                                            title={`map-${req.id}`}
                                                            width="100%"
                                                            height="100%"
                                                            frameBorder="0"
                                                            marginHeight={0}
                                                            marginWidth={0}
                                                            src={`https://maps.google.com/maps?q=${coords.lat},${coords.lng}&z=14&output=embed`}
                                                            className="absolute inset-0"
                                                        />
                                                    </div>
                                                )}

                                                {req.notes && (
                                                    <div className="text-[9px] bg-slate-50 border border-slate-100 p-2.5 rounded-xl text-slate-500 font-bold leading-normal normal-case mt-2">
                                                        📝 Catatan: {req.notes.replace(/https?:\/\/[^\s]+/, '').trim() || 'Ada koordinat GPS'}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-4 border-t border-gray-100 space-y-3 shrink-0">
                                            {/* Highlight Action Banner for PENDING_ONBOARDING / SUBMITTED */}
                                            {isReadyForReview && (
                                                <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl flex flex-col gap-2.5 shadow-xs">
                                                    <div className="flex items-center gap-2">
                                                        <span className="flex h-2 w-2 relative">
                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                                                        </span>
                                                        <span className="text-[11px] font-black text-emerald-950 uppercase tracking-wider">Hasil Survey Siap Ditinjau</span>
                                                    </div>
                                                    <p className="text-[10px] text-emerald-800 font-medium leading-relaxed">
                                                        Data properti, kamar, dan foto hasil survey telah dikirim oleh surveyor lapangan.
                                                    </p>
                                                    <button
                                                        type="button"
                                                        onClick={() => openReviewModal(req)}
                                                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                                                    >
                                                        <span className="material-symbols-outlined text-base">fact_check</span>
                                                        Tinjau Hasil Pendataan Lengkap
                                                    </button>
                                                </div>
                                            )}

                                            {/* Button for ACTIVE properties to view details */}
                                            {req.status === 'ACTIVE' && (
                                                <button
                                                    type="button"
                                                    onClick={() => openReviewModal(req)}
                                                    className="w-full bg-gray-900 hover:bg-gray-800 text-white py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-2"
                                                >
                                                    <span className="material-symbols-outlined text-base">visibility</span>
                                                    Lihat Detail Listing &amp; Data
                                                </button>
                                            )}

                                            {/* Agent Assignment Info / Dropdown Inline */}
                                            {req.status === 'PENDING_ASSIGNMENT' ? (
                                                <div className="bg-orange-50/50 border border-orange-100 p-3 rounded-2xl space-y-2">
                                                    <label className="text-[9px] font-black text-orange-700 uppercase tracking-widest block">Tugaskan Agen Survey</label>
                                                    <div className="flex gap-2">
                                                        <select
                                                            value={assignAgentMap[req.id] || ''}
                                                            onChange={e => setAssignAgentMap({ ...assignAgentMap, [req.id]: e.target.value })}
                                                            className="flex-1 bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-orange-500/20"
                                                        >
                                                            <option value="">-- Pilih Agen --</option>
                                                            {agents.map(agent => (
                                                                <option key={agent.id} value={agent.id}>{agent.name}</option>
                                                            ))}
                                                        </select>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleAssignAgentInline(req.id, assignAgentMap[req.id])}
                                                            className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 shrink-0"
                                                        >
                                                            Tugaskan
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : req.agent_name ? (
                                                <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl flex justify-between items-center text-xs font-bold">
                                                    <div>
                                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">Agen Survey Lapangan</span>
                                                        <span className="font-bold text-slate-800">{req.agent_name}</span>
                                                    </div>
                                                    {req.result_drive_link && (
                                                        <a
                                                            href={req.result_drive_link}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 font-bold hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1"
                                                        >
                                                            📂 GDrive
                                                        </a>
                                                    )}
                                                </div>
                                            ) : null}

                                            {/* Transaksi & Action Buttons */}
                                            <div className="flex justify-between items-center pt-2">
                                                <div>
                                                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-wider block">Total Bayar</span>
                                                    <span className="font-black text-gray-900 text-sm">{FORMAT_CURRENCY(req.transaction?.amount || 150000)}</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setEditingRequest(req);
                                                            setEditForm({
                                                                assigned_agent_id: req.assigned_agent_id || '',
                                                                result_drive_link: req.result_drive_link || ''
                                                            });
                                                        }}
                                                        className="px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                                                    >
                                                        Kelola
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(req.id, req.kost_name)}
                                                        className="px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                                                    >
                                                        Hapus
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ======================================================== */}
            {/* COMPREHENSIVE KOSTMANAGER REVIEW & INSPECTION MODAL */}
            {/* ======================================================== */}
            {reviewModalOpen && reviewRequest && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-md animate-in fade-in">
                    <div className="absolute inset-0" onClick={() => setReviewModalOpen(false)}></div>
                    <div 
                        className="bg-white w-full max-w-5xl rounded-[2.5rem] shadow-2xl relative z-10 flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 border border-slate-100"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="p-6 pb-4 border-b border-gray-100 bg-slate-50/70 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border shadow-xs ${getStatusBadge(reviewRequest.status)}`}>
                                        {getStatusLabel(reviewRequest.status)}
                                    </span>
                                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-orange-100 text-orange-800 border border-orange-200">
                                        {reviewProperty?.type || reviewRequest.kost_type || 'Campur'}
                                    </span>
                                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-700">
                                        ID: #{reviewRequest.id.substring(0, 8)}
                                    </span>
                                </div>
                                <h3 className="text-xl sm:text-2xl font-black text-gray-900 uppercase tracking-tight truncate">
                                    {reviewProperty?.title || reviewRequest.kost_name}
                                </h3>
                                <p className="text-xs text-gray-500 font-medium truncate mt-0.5">
                                    📍 {reviewProperty?.address || reviewRequest.kost_address}
                                </p>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-auto">
                                <button
                                    type="button"
                                    onClick={() => setReviewModalOpen(false)}
                                    className="w-10 h-10 rounded-full bg-white hover:bg-gray-100 text-gray-500 flex items-center justify-center border border-gray-200 transition-all font-bold text-lg shadow-xs"
                                >
                                    &times;
                                </button>
                            </div>
                        </div>

                        {/* Top Info Strip: Owner & Agent Details */}
                        <div className="bg-slate-100/70 px-6 py-3 border-b border-gray-200/70 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-orange-500 text-white font-black flex items-center justify-center text-xs">
                                    {(reviewRequest.user?.name || 'M').charAt(0)}
                                </div>
                                <div>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Pemilik / Mitra Kost</span>
                                    <span className="font-black text-slate-800">{reviewRequest.user?.name || reviewRequest.owner_name || 'Mitra Pemesan'}</span>
                                </div>
                                <a
                                    href={`https://wa.me/${(reviewRequest.user?.phone || reviewRequest.owner_phone || '').replace(/[^0-9]/g, '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-2 px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[10px] hover:bg-emerald-700 transition-colors flex items-center gap-1 shadow-xs"
                                >
                                    <span>WhatsApp</span>
                                </a>
                            </div>

                            <div className="flex items-center gap-3">
                                <div>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Surveyor Lapangan</span>
                                    <span className="font-black text-slate-800">{reviewRequest.agent_name || 'Agen RuangSinggah'}</span>
                                </div>
                                {(reviewSurvey?.result_drive_link || reviewRequest.result_drive_link) && (
                                    <a
                                        href={reviewSurvey?.result_drive_link || reviewRequest.result_drive_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-3 py-1.5 rounded-xl bg-blue-600 text-white font-black text-[10px] uppercase tracking-wider hover:bg-blue-700 transition-colors flex items-center gap-1.5 shadow-sm"
                                    >
                                        <FolderOpen size={14} />
                                        Folder GDrive
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* 3-Tab Navigation */}
                        <div className="flex border-b border-gray-100 bg-white px-4 gap-1 overflow-x-auto shrink-0">
                            {[
                                { key: 'info', icon: <Building2 size={14}/>, label: '1. DATA PROPERTI UMUM', badge: normalizePhotos(reviewProperty?.image_urls).length || null },
                                { key: 'rooms', icon: <Bed size={14}/>, label: '2. DATA KAMAR & PENGHUNI', badge: (reviewProperty?.room_types || []).length || null },
                                { key: 'legal', icon: <ShieldCheck size={14}/>, label: '3. DATA MITRA & KERJASAMA', badge: reviewSurvey?.signature_data ? '✓' : null }
                            ].map(t => (
                                <button
                                    key={t.key}
                                    type="button"
                                    onClick={() => setReviewActiveTab(t.key as any)}
                                    className={`py-3.5 px-3 text-[11px] font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                                        reviewActiveTab === t.key
                                            ? 'border-emerald-600 text-emerald-700 bg-emerald-50/40'
                                            : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                                >
                                    {t.icon}
                                    <span>{t.label}</span>
                                    {t.badge !== null && t.badge !== 0 && (
                                        <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${
                                            reviewActiveTab === t.key ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-700'
                                        }`}>
                                            {t.badge}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Modal Body / Tab Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {loadingReview ? (
                                <div className="py-24 text-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
                                    <p className="text-xs font-bold text-gray-400 mt-3 uppercase tracking-wider">Memuat Seluruh Berkas Pendataan...</p>
                                </div>
                            ) : (
                                <>
                                    {/* ================= TAB 1: DATA PROPERTI UMUM ================= */}
                                    {reviewActiveTab === 'info' && (
                                        <div className="space-y-6 animate-in fade-in duration-300">

                                            {/* HERO CAROUSEL FOTO PROPERTI */}
                                            {(() => {
                                                const allPhotos = normalizePhotos(reviewProperty?.image_urls);
                                                if (allPhotos.length === 0) return null;
                                                const idx = Math.min(selectedHeroPhotoIndex, allPhotos.length - 1);
                                                const photo = allPhotos[idx];
                                                return (
                                                    <div className="rounded-3xl overflow-hidden border border-slate-200 shadow-md bg-slate-950">
                                                        {/* Main Slide */}
                                                        <div className="relative" style={{aspectRatio:'16/7'}}>
                                                            <img src={photo.url} alt={photo.label} className="w-full h-full object-cover opacity-95" />
                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/40 pointer-events-none" />
                                                            
                                                            {/* Top Badges */}
                                                            <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                                                                <span className="px-3 py-1 rounded-xl bg-black/60 text-white text-[10px] font-black uppercase tracking-wider backdrop-blur-md border border-white/10 shadow-sm">
                                                                    📸 {photo.label}
                                                                </span>
                                                                <div className="flex items-center gap-2 pointer-events-auto">
                                                                    <span className="px-3 py-1 rounded-xl bg-black/60 text-white text-[10px] font-black backdrop-blur-md border border-white/10 shadow-sm">
                                                                        {idx + 1} / {allPhotos.length} FOTO
                                                                    </span>
                                                                    <button 
                                                                        type="button"
                                                                        onClick={() => setLightboxPhoto(photo)} 
                                                                        className="p-2 rounded-xl bg-black/60 text-white hover:bg-black/80 transition-colors backdrop-blur-md border border-white/10 shadow-sm"
                                                                        title="Perbesar Foto"
                                                                    >
                                                                        <ZoomIn size={14}/>
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            {/* Bottom Caption Bar on Main Slide */}
                                                            <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between pointer-events-none">
                                                                <div className="bg-black/60 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/15 shadow-lg max-w-[80%]">
                                                                    <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest block">
                                                                        Kategori Foto Dokumentasi #{idx + 1}
                                                                    </span>
                                                                    <h4 className="text-base sm:text-lg font-black text-white uppercase tracking-tight drop-shadow-sm">
                                                                        {photo.label}
                                                                    </h4>
                                                                </div>
                                                            </div>

                                                            {/* Prev / Next Navigation */}
                                                            {allPhotos.length > 1 && (
                                                                <>
                                                                    <button 
                                                                        type="button"
                                                                        onClick={() => setSelectedHeroPhotoIndex(Math.max(0, idx - 1))} 
                                                                        disabled={idx === 0}
                                                                        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-2xl bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-all disabled:opacity-20 backdrop-blur-md border border-white/10 shadow-md active:scale-95"
                                                                    >
                                                                        <ChevronLeft size={18}/>
                                                                    </button>
                                                                    <button 
                                                                        type="button"
                                                                        onClick={() => setSelectedHeroPhotoIndex(Math.min(allPhotos.length - 1, idx + 1))} 
                                                                        disabled={idx === allPhotos.length - 1}
                                                                        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-2xl bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-all disabled:opacity-20 backdrop-blur-md border border-white/10 shadow-md active:scale-95"
                                                                    >
                                                                        <ChevronRight size={18}/>
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>

                                                        {/* Thumbnail Strip with Complete Captions */}
                                                        <div className="p-3 bg-slate-900 border-t border-white/10">
                                                            <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-thin">
                                                                {allPhotos.map((p, i) => (
                                                                    <button 
                                                                        key={i} 
                                                                        type="button"
                                                                        onClick={() => setSelectedHeroPhotoIndex(i)}
                                                                        className={`shrink-0 flex flex-col items-center gap-1.5 p-1.5 rounded-2xl border transition-all text-left group ${
                                                                            i === idx 
                                                                                ? 'bg-white/15 border-emerald-400 shadow-md ring-2 ring-emerald-400/30 scale-[1.02]' 
                                                                                : 'bg-white/5 border-white/10 opacity-70 hover:opacity-100 hover:bg-white/10 hover:border-white/20'
                                                                        }`}
                                                                    >
                                                                        <div className="w-20 sm:w-24 h-14 rounded-xl overflow-hidden relative shadow-inner bg-black/40">
                                                                            <img src={p.url} alt={p.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                                                                            <span className="absolute bottom-1 right-1 px-1.5 py-0.2 bg-black/75 text-[8px] font-mono text-white rounded font-bold backdrop-blur-xs">
                                                                                #{i + 1}
                                                                            </span>
                                                                        </div>
                                                                        <span className={`text-[10px] font-black uppercase tracking-wider max-w-[80px] sm:max-w-[96px] text-center leading-tight line-clamp-2 px-0.5 ${
                                                                            i === idx ? 'text-emerald-300' : 'text-slate-300'
                                                                        }`}>
                                                                            {p.label}
                                                                        </span>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })()}

                                            {/* KARTU FASILITAS UMUM DENGAN TWO-WAY CAROUSEL SYNC & SMART SUB-INPUT */}
                                            {reviewProperty?.facilities && reviewProperty.facilities.length > 0 && (() => {
                                                const allPhotos = normalizePhotos(reviewProperty?.image_urls);

                                                const FACILITY_ICONS: Record<string,any> = {
                                                    'parkir': ParkingCircle, 'wc': Bath, 'toilet': Bath, 'dapur': CookingPot,
                                                    'wifi': Sparkles, 'cctv': ShieldCheck, 'tamu': Building2, 'default': Sparkles
                                                };
                                                const getFacilityIcon = (name: string) => {
                                                    const lower = name.toLowerCase();
                                                    for (const [k, Icon] of Object.entries(FACILITY_ICONS)) {
                                                        if (lower.includes(k)) return Icon;
                                                    }
                                                    return FACILITY_ICONS.default;
                                                };

                                                const getFacilityPhotoIndex = (name: string) => {
                                                    const lower = name.toLowerCase();
                                                    let targetKeywords: string[] = [lower];
                                                    if (lower.includes('parkir')) targetKeywords = ['parkir', 'parkiran', 'tempat parkir', 'area parkir'];
                                                    else if (lower.includes('wc') || lower.includes('toilet')) targetKeywords = ['wc', 'toilet', 'kamar mandi', 'wc umum'];
                                                    else if (lower.includes('dapur')) targetKeywords = ['dapur', 'dapur bersama', 'kitchen'];
                                                    else if (lower.includes('wifi')) targetKeywords = ['wifi', 'internet'];
                                                    else if (lower.includes('tamu')) targetKeywords = ['tamu', 'ruang tamu', 'lobby', 'santai'];
                                                    else if (lower.includes('cctv')) targetKeywords = ['cctv', 'keamanan'];
                                                    else if (lower.includes('laundry')) targetKeywords = ['laundry', 'mesin cuci', 'jemuran'];

                                                    return allPhotos.findIndex(p => {
                                                        const pLabel = p.label.toLowerCase();
                                                        return targetKeywords.some(kw => pLabel.includes(kw) || kw.includes(pLabel));
                                                    });
                                                };

                                                const getItemVehicleIcon = (item: string) => {
                                                    const lower = item.toLowerCase();
                                                    if (lower.includes('motor')) return '🏍️';
                                                    if (lower.includes('mobil')) return '🚗';
                                                    if (lower.includes('sepeda')) return '🚲';
                                                    return '✨';
                                                };

                                                return (
                                                    <div className="space-y-2.5">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                                                                Fasilitas Umum Kost
                                                            </span>
                                                            <span className="text-[10px] font-bold text-slate-500">
                                                                💡 Klik fasilitas untuk melihat foto dokumentasi
                                                            </span>
                                                        </div>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                            {reviewProperty.facilities.map((fac: any, fi: number) => {
                                                                const facName = typeof fac === 'string' ? fac : (fac?.name || '-');
                                                                let facItems: string[] = typeof fac === 'object' ? (fac?.items || fac?.details || []) : [];
                                                                
                                                                // Check if this facility is Area Parkir and retrieve from publicParkingFacilities if needed
                                                                const isParking = facName.toLowerCase().includes('parkir');
                                                                if (isParking && facItems.length === 0) {
                                                                    const propParking = reviewProperty?.publicParkingFacilities || 
                                                                                        reviewProperty?.metadata?.publicParkingFacilities || 
                                                                                        reviewRequest?.publicParkingFacilities || 
                                                                                        reviewRequest?.metadata?.publicParkingFacilities || [];
                                                                    if (Array.isArray(propParking) && propParking.length > 0) {
                                                                        facItems = propParking;
                                                                    }
                                                                }

                                                                const hasSubData = facItems.length > 0;
                                                                const expectsSubInput = isParking;
                                                                const isMissingSubInput = expectsSubInput && !hasSubData;
                                                                
                                                                const photoIndex = getFacilityPhotoIndex(facName);
                                                                const hasPhoto = photoIndex !== -1;
                                                                const isPhotoActive = hasPhoto && selectedHeroPhotoIndex === photoIndex;

                                                                const Icon = getFacilityIcon(facName);

                                                                return (
                                                                    <div 
                                                                        key={fi} 
                                                                        onClick={() => {
                                                                            if (hasPhoto) {
                                                                                setSelectedHeroPhotoIndex(photoIndex);
                                                                            }
                                                                        }}
                                                                        className={`rounded-2xl p-4 space-y-2.5 transition-all duration-200 text-left ${
                                                                            hasPhoto ? 'cursor-pointer hover:shadow-md hover:scale-[1.01]' : ''
                                                                        } ${
                                                                            isPhotoActive 
                                                                                ? 'bg-emerald-50/90 border-2 border-emerald-500 shadow-md ring-4 ring-emerald-500/10' 
                                                                                : isMissingSubInput
                                                                                    ? 'bg-amber-50/60 border border-amber-200/90'
                                                                                    : 'bg-slate-50 border border-slate-200/80 hover:border-slate-300'
                                                                        }`}
                                                                    >
                                                                        <div className="flex items-center justify-between gap-2">
                                                                            <div className="flex items-center gap-2.5 min-w-0">
                                                                                <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                                                                                    isPhotoActive 
                                                                                        ? 'bg-emerald-600 text-white shadow-sm' 
                                                                                        : isMissingSubInput
                                                                                            ? 'bg-amber-100 text-amber-800'
                                                                                            : 'bg-emerald-100 text-emerald-700'
                                                                                }`}>
                                                                                    <Icon size={18}/>
                                                                                </span>
                                                                                <div className="min-w-0">
                                                                                    <span className={`text-xs font-black uppercase tracking-wide truncate block ${
                                                                                        isPhotoActive ? 'text-emerald-950' : 'text-slate-900'
                                                                                    }`}>
                                                                                        {facName}
                                                                                    </span>
                                                                                    {hasPhoto && (
                                                                                        <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1 mt-0.5">
                                                                                            <Camera size={10} className="text-slate-400"/>
                                                                                            <span className="hover:underline">{isPhotoActive ? 'Sedang Ditampilkan di Slider' : 'Lihat Foto di Slider'}</span>
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                            </div>

                                                                            {/* Badge Status */}
                                                                            <div className="shrink-0 flex items-center gap-1.5">
                                                                                {isPhotoActive ? (
                                                                                    <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-xs animate-pulse">
                                                                                        <Camera size={10}/> FOTO AKTIF
                                                                                    </span>
                                                                                ) : isMissingSubInput ? (
                                                                                    <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 text-[9px] font-black uppercase flex items-center gap-1">
                                                                                        ⚠️ RINCIAN KOSONG
                                                                                    </span>
                                                                                ) : (
                                                                                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-black uppercase flex items-center gap-1">
                                                                                        <Check size={10}/> AKTIF
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </div>

                                                                        {/* Sub-Data Rincian (Jika Ada) */}
                                                                        {hasSubData && (
                                                                            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-200/60">
                                                                                {facItems.map((item: string, ii: number) => (
                                                                                    <span 
                                                                                        key={ii} 
                                                                                        className={`px-2.5 py-1 rounded-xl text-[10px] font-bold flex items-center gap-1 transition-all ${
                                                                                            isPhotoActive
                                                                                                ? 'bg-white border border-emerald-200 text-emerald-900 shadow-2xs'
                                                                                                : 'bg-white border border-slate-200 text-slate-800 shadow-2xs hover:border-slate-300'
                                                                                        }`}
                                                                                    >
                                                                                        <span>{getItemVehicleIcon(item)}</span>
                                                                                        <span>{item}</span>
                                                                                    </span>
                                                                                ))}
                                                                            </div>
                                                                        )}

                                                                        {/* Peringatan Sub-Input Kosong Khusus Fasilitas yang Wajib */}
                                                                        {isMissingSubInput && (
                                                                            <div className="pt-1.5 border-t border-amber-200/60">
                                                                                <p className="text-[10px] font-medium text-amber-800 italic">
                                                                                    Jenis fasilitas parkir belum dispesifikasikan oleh surveyor saat pendataan.
                                                                                </p>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                );
                                            })()}

                                            {/* Lokasi & Peta GPS */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-4">
                                                    <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200/80 space-y-3 shadow-2xs">
                                                        <div className="flex items-center gap-2">
                                                            <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                                                                <MapPin size={13}/>
                                                            </span>
                                                            <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest block">
                                                                Alamat &amp; Titik Koordinat
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-slate-800 font-bold leading-relaxed">
                                                            {reviewProperty?.address || reviewRequest.kost_address}
                                                        </p>
                                                        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200/60 text-xs">
                                                            <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                                                                <span className="text-[9px] font-black text-slate-400 uppercase block">Kota / Wilayah</span>
                                                                <span className="font-bold text-slate-800">{reviewProperty?.city || reviewProperty?.area || 'Makassar'}</span>
                                                            </div>
                                                            <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                                                                <span className="text-[9px] font-black text-slate-400 uppercase block">Latitude</span>
                                                                <span className="font-mono font-bold text-slate-800">{reviewProperty?.location?.lat || reviewProperty?.latitude || '-'}</span>
                                                            </div>
                                                            <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                                                                <span className="text-[9px] font-black text-slate-400 uppercase block">Longitude</span>
                                                                <span className="font-mono font-bold text-slate-800">{reviewProperty?.location?.lng || reviewProperty?.longitude || '-'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Preview Google Maps</span>
                                                        {(() => {
                                                            const lat = reviewProperty?.location?.lat || reviewProperty?.latitude || -5.147665;
                                                            const lng = reviewProperty?.location?.lng || reviewProperty?.longitude || 119.432731;
                                                            return (
                                                                <a 
                                                                    href={`https://www.google.com/maps?q=${lat},${lng}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-[10px] font-black text-emerald-600 hover:text-emerald-700 uppercase tracking-wider flex items-center gap-1 hover:underline"
                                                                >
                                                                    <MapPin size={11}/>
                                                                    Buka Google Maps ↗
                                                                </a>
                                                            );
                                                        })()}
                                                    </div>
                                                    {(() => {
                                                        const lat = reviewProperty?.location?.lat || reviewProperty?.latitude || -5.147665;
                                                        const lng = reviewProperty?.location?.lng || reviewProperty?.longitude || 119.432731;
                                                        return (
                                                            <div className="h-44 sm:h-52 rounded-3xl overflow-hidden border border-slate-200 relative shadow-inner">
                                                                <iframe title="review-map" width="100%" height="100%" frameBorder="0"
                                                                    src={`https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed`}
                                                                    className="absolute inset-0" />
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            </div>

                                            {/* KAMPUS & LANDMARK TERDEKAT DENGAN RUTE GOOGLE MAPS & DATA REAL-TIME */}
                                            {reviewProperty?.campuses && reviewProperty.campuses.length > 0 && (
                                                <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200/80 space-y-3.5 shadow-2xs">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <span className="w-6 h-6 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center">
                                                                <Navigation size={13}/>
                                                            </span>
                                                            <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest block">
                                                                Kampus &amp; Landmark Terdekat
                                                            </span>
                                                        </div>
                                                        <span className="text-[10px] font-bold text-slate-500">
                                                            {loadingDistances ? '⏳ Menghitung rute Maps...' : '🗺️ Rute & Jarak Terverifikasi Google Maps'}
                                                        </span>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        {reviewProperty.campuses.map((c: any, i: number) => {
                                                            const cName = typeof c === 'string' ? c : (c?.name || '-');
                                                            const cLat = typeof c === 'object' ? c?.lat : undefined;
                                                            const cLng = typeof c === 'object' ? c?.lng : undefined;
                                                            const info = realtimeDistances[cName] || {
                                                                distance: c?.distance || '1.2 km',
                                                                walkDuration: '15 mnt',
                                                                motoDuration: '4 mnt',
                                                                carDuration: '7 mnt'
                                                            };

                                                            const kostLat = reviewProperty?.location?.lat || reviewProperty?.latitude || -5.147665;
                                                            const kostLng = reviewProperty?.location?.lng || reviewProperty?.longitude || 119.432731;
                                                            const destinationParam = (cLat && cLng) ? `${cLat},${cLng}` : encodeURIComponent(`${cName}, Makassar`);
                                                            const mapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${kostLat},${kostLng}&destination=${destinationParam}`;

                                                            return (
                                                                <div key={i} className="bg-white border border-slate-200/90 rounded-2xl p-4 space-y-3 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between">
                                                                    <div className="flex items-start justify-between gap-2">
                                                                        <div className="flex items-center gap-2.5 min-w-0">
                                                                            <span className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-100 text-orange-700 flex items-center justify-center shrink-0 text-base">
                                                                                🏫
                                                                            </span>
                                                                            <div className="min-w-0">
                                                                                <h5 className="text-xs font-black text-slate-900 uppercase tracking-tight truncate">
                                                                                    {cName}
                                                                                </h5>
                                                                                <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                                                                    <MapPin size={10} className="text-slate-400"/>
                                                                                    {cLat && cLng ? `Pin: ${Number(cLat).toFixed(4)}, ${Number(cLng).toFixed(4)}` : 'Makassar'}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                        
                                                                        <div className="flex flex-col items-end gap-1 shrink-0">
                                                                            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-black">
                                                                                📍 {info.distance}
                                                                            </span>
                                                                        </div>
                                                                    </div>

                                                                    {/* Estimasi Waktu Tempuh Moda Transportasi */}
                                                                    <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-slate-100 text-[10px] font-bold">
                                                                        <span className="px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 flex items-center gap-1">
                                                                            🚶 <span>{info.walkDuration}</span>
                                                                        </span>
                                                                        <span className="px-2 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 flex items-center gap-1">
                                                                            🏍️ <span>{info.motoDuration}</span>
                                                                        </span>
                                                                        <span className="px-2 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 flex items-center gap-1">
                                                                            🚗 <span>{info.carDuration}</span>
                                                                        </span>
                                                                    </div>

                                                                    {/* Tombol Lihat Rute Google Maps */}
                                                                    <a
                                                                        href={mapsDirectionsUrl}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="w-full py-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-200 text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 active:scale-98 shadow-2xs hover:shadow-xs"
                                                                    >
                                                                        <Navigation size={11} className="text-orange-600"/>
                                                                        <span>Lihat Rute di Google Maps ↗</span>
                                                                    </a>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            {/* PERATURAN & KETENTUAN KOST */}
                                            {reviewProperty?.rules && reviewProperty.rules.length > 0 && (
                                                <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200/80 space-y-3 shadow-2xs">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-6 h-6 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                                                            <ShieldAlert size={13}/>
                                                        </span>
                                                        <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest block">
                                                            Peraturan &amp; Ketentuan Kost
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                                        {reviewProperty.rules.map((r: string, i: number) => (
                                                            <div key={i} className="bg-white border border-rose-100 rounded-2xl p-3.5 flex items-start gap-2.5 shadow-2xs">
                                                                <span className="w-5 h-5 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 text-xs font-black mt-0.5">
                                                                    ⛔
                                                                </span>
                                                                <span className="text-xs font-bold text-slate-800 leading-snug">
                                                                    {r}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* ================= TAB 2: DATA KAMAR & PENGHUNI ================= */}
                                    {reviewActiveTab === 'rooms' && (() => {
                                        const rawRoomTypes = reviewProperty?.room_types || [];
                                        if (rawRoomTypes.length === 0) return (
                                            <div className="py-16 text-center text-slate-400 font-bold uppercase text-xs">Tidak ada data tipe kamar terdata.</div>
                                        );

                                        const DEFAULT_ROOM_PHOTO_SLOTS = ['Interior Kamar', 'Kamar Mandi Dalam', 'Tempat Tidur', 'Lemari / Penyimpanan'];

                                        const getRoomPhotos = (room: any) => {
                                            if (!room) return [];
                                            const rawImages = room.images || room.image_urls || room.photos || [];
                                            return rawImages.map((img: any, imgIdx: number) => {
                                                if (!img) return null;
                                                const url = typeof img === 'string' ? img : (img?.url || img?.original || '');
                                                if (!url) return null;
                                                let label = '';
                                                if (room.photoCategories?.[imgIdx]) label = room.photoCategories[imgIdx];
                                                else if (typeof img === 'object' && img?.label) label = img.label;
                                                else if (imgIdx < DEFAULT_ROOM_PHOTO_SLOTS.length) label = DEFAULT_ROOM_PHOTO_SLOTS[imgIdx];
                                                else label = `Foto Tambahan ${imgIdx - DEFAULT_ROOM_PHOTO_SLOTS.length + 1}`;
                                                label = label.replace(/\s*\*Wajib/i, '').replace(/\(Opsional\)/i, '').trim();
                                                return { url, label };
                                            }).filter(Boolean) as {url:string;label:string}[];
                                        };

                                        const formatRoomName = (name: string, idx: number) => {
                                            if (!name) return `Kamar ${idx + 1}`;
                                            const clean = String(name).trim();
                                            if (/^\d+$/.test(clean)) return `Kamar ${clean}`;
                                            if (/^kamar/i.test(clean)) return clean;
                                            return clean;
                                        };

                                        // Pengelompokan Tipe Kamar Sejati (misal Tipe Standard, Tipe Deluxe) yang menaungi unit-unit kamar (Kamar 1, Kamar 2, Kamar 3)
                                        const groupIntoRoomTypes = (rawList: any[]) => {
                                            if (!Array.isArray(rawList) || rawList.length === 0) return [];

                                            const hasExplicitSubUnits = rawList.some(rt => (Array.isArray(rt.rooms) && rt.rooms.length > 0) || (Array.isArray(rt.unit_rooms) && rt.unit_rooms.length > 0));

                                            if (hasExplicitSubUnits) {
                                                return rawList.map((rt, idx) => {
                                                    const rawUnits = (Array.isArray(rt.rooms) && rt.rooms.length > 0) ? rt.rooms : (Array.isArray(rt.unit_rooms) ? rt.unit_rooms : [rt]);
                                                    const occupiedUnits: any[] = [];
                                                    const vacantUnits: any[] = [];

                                                    rawUnits.forEach((u: any, uIdx: number) => {
                                                        const isUnitOcc = u?.status === 'Terisi' || u?.status === 'occupied' || u?.is_occupied === true || u?.isAvailable === false || Boolean(u?.occupant_name || u?.occupant_phone || u?.residentName || u?.residentPhone);
                                                        const unitName = formatRoomName(u?.name || u?.room_number || String(uIdx + 1), uIdx);
                                                        const normalizedUnit = {
                                                            id: u?.id || `unit_${idx}_${uIdx}`,
                                                            name: unitName,
                                                            rawName: u?.name || u?.room_number || `Kamar ${uIdx + 1}`,
                                                            residentName: u?.residentName || u?.occupant_name || u?.occupantName || rt.residentName || rt.occupant_name || '-',
                                                            residentPhone: u?.residentPhone || u?.occupant_phone || u?.occupantPhone || rt.residentPhone || rt.occupant_phone || '-',
                                                            paymentPeriod: u?.paymentPeriod || u?.rentPeriod || rt.paymentPeriod || rt.rentPeriod || 'Bulanan',
                                                            startDate: u?.startDate || u?.rentStartDate || rt.startDate || rt.rentStartDate || '',
                                                            endDate: u?.endDate || u?.rentEndDate || rt.endDate || rt.rentEndDate || '',
                                                            currentOccupants: Number(u?.currentOccupants || rt.currentOccupants || 1),
                                                            additionalOccupants: u?.additionalOccupants || rt.additionalOccupants || [],
                                                            size: u?.size || rt.size || '3x4 meter',
                                                            price: Number(u?.price || rt.price || 0),
                                                            facilities: u?.facilities || u?.roomFacilities || rt.roomFacilities || rt.room_facilities || [],
                                                            bathroomFacilities: u?.bathroomFacilities || rt.bathroomFacilities || rt.bathroom_facilities || [],
                                                            photos: getRoomPhotos(u).length > 0 ? getRoomPhotos(u) : getRoomPhotos(rt),
                                                            notes: u?.notes || rt.notes || rt.surveyorNotes || '',
                                                            isOccupied: isUnitOcc
                                                        };
                                                        if (isUnitOcc) occupiedUnits.push(normalizedUnit);
                                                        else vacantUnits.push(normalizedUnit);
                                                    });

                                                    let typeTitle = rt.typeName || rt.type || '';
                                                    if (!typeTitle || /^\d+$/.test(String(rt.name).trim()) || /^kamar\s*\d+/i.test(String(rt.name).trim())) {
                                                        typeTitle = rawList.length > 1 ? `Tipe Kamar #${idx + 1}` : 'Tipe Standard';
                                                    } else {
                                                        typeTitle = /^tipe/i.test(String(rt.name).trim()) ? rt.name.trim() : `Tipe ${rt.name.trim()}`;
                                                    }

                                                    return {
                                                        id: rt.id || `rt_${idx}`,
                                                        name: typeTitle,
                                                        size: rt.size || '3x4 meter',
                                                        price: Number(rt.price || 0),
                                                        roomFacilities: rt.roomFacilities || rt.room_facilities || [],
                                                        bathroomFacilities: rt.bathroomFacilities || rt.bathroom_facilities || [],
                                                        kitchenFacilities: rt.kitchenFacilities || rt.kitchen_facilities || [],
                                                        photos: getRoomPhotos(rt),
                                                        occupiedUnits,
                                                        vacantUnits,
                                                        totalUnits: occupiedUnits.length + vacantUnits.length
                                                    };
                                                });
                                            }

                                            // Mengelompokkan kamar-kamar yang didata surveyor ke Tipe Kamar
                                            const typeGroups: { [key: string]: any } = {};

                                            rawList.forEach((roomItem: any, idx: number) => {
                                                let typeName = roomItem.typeName || roomItem.type || '';
                                                const rawName = String(roomItem.name || '').trim();
                                                if (!typeName) {
                                                    if (rawName && !/^\d+$/.test(rawName) && !/^kamar\s*\d+/i.test(rawName)) {
                                                        typeName = rawName;
                                                    } else {
                                                        typeName = 'Standard';
                                                    }
                                                }
                                                const groupKey = `${typeName}_${roomItem.size || '3x4'}_${roomItem.price || 0}`;

                                                if (!typeGroups[groupKey]) {
                                                    typeGroups[groupKey] = {
                                                        id: `rt_group_${idx}`,
                                                        name: /^tipe/i.test(typeName) ? typeName : `Tipe ${typeName}`,
                                                        size: roomItem.size || '3x4 meter',
                                                        price: Number(roomItem.price || 0),
                                                        roomFacilities: roomItem.roomFacilities || roomItem.room_facilities || [],
                                                        bathroomFacilities: roomItem.bathroomFacilities || roomItem.bathroom_facilities || [],
                                                        kitchenFacilities: roomItem.kitchenFacilities || roomItem.kitchen_facilities || [],
                                                        photos: getRoomPhotos(roomItem),
                                                        occupiedUnits: [],
                                                        vacantUnits: []
                                                    };
                                                }

                                                const isUnitOcc = roomItem.status === 'Terisi' || roomItem.status === 'occupied' || roomItem.is_occupied === true || roomItem.isAvailable === false || Boolean(roomItem.occupant_name || roomItem.occupant_phone || roomItem.residentName || roomItem.residentPhone);
                                                const unitName = formatRoomName(roomItem.name || String(idx + 1), idx);

                                                const normalizedUnit = {
                                                    id: roomItem.id || `unit_${idx}`,
                                                    name: unitName,
                                                    rawName: roomItem.name || `Kamar ${idx + 1}`,
                                                    residentName: roomItem.residentName || roomItem.occupant_name || roomItem.occupantName || '-',
                                                    residentPhone: roomItem.residentPhone || roomItem.occupant_phone || roomItem.occupantPhone || '-',
                                                    paymentPeriod: roomItem.paymentPeriod || roomItem.rentPeriod || 'Bulanan',
                                                    startDate: roomItem.startDate || roomItem.rentStartDate || '',
                                                    endDate: roomItem.endDate || roomItem.rentEndDate || '',
                                                    currentOccupants: Number(roomItem.currentOccupants || 1),
                                                    additionalOccupants: roomItem.additionalOccupants || [],
                                                    size: roomItem.size || typeGroups[groupKey].size,
                                                    price: Number(roomItem.price || typeGroups[groupKey].price),
                                                    facilities: roomItem.roomFacilities || roomItem.room_facilities || typeGroups[groupKey].roomFacilities,
                                                    bathroomFacilities: roomItem.bathroomFacilities || roomItem.bathroom_facilities || typeGroups[groupKey].bathroomFacilities,
                                                    photos: getRoomPhotos(roomItem),
                                                    notes: roomItem.notes || roomItem.surveyorNotes || '',
                                                    isOccupied: isUnitOcc
                                                };

                                                if (isUnitOcc) {
                                                    typeGroups[groupKey].occupiedUnits.push(normalizedUnit);
                                                } else {
                                                    typeGroups[groupKey].vacantUnits.push(normalizedUnit);
                                                }
                                            });

                                            return Object.values(typeGroups).map(g => ({
                                                ...g,
                                                totalUnits: g.occupiedUnits.length + g.vacantUnits.length
                                            }));
                                        };

                                        const groupedRoomTypes = groupIntoRoomTypes(rawRoomTypes);

                                        // Hitung Ringkasan Statistik Kamar & Penghuni
                                        let totalRooms = 0;
                                        let occupiedRooms = 0;
                                        let availableRooms = 0;
                                        let totalOccupants = 0;

                                        groupedRoomTypes.forEach((gt: any) => {
                                            totalRooms += gt.totalUnits;
                                            occupiedRooms += gt.occupiedUnits.length;
                                            availableRooms += gt.vacantUnits.length;
                                            gt.occupiedUnits.forEach((u: any) => {
                                                totalOccupants += Number(u.currentOccupants || 1);
                                            });
                                        });

                                        return (
                                            <div className="space-y-6 animate-in fade-in duration-300">
                                                {/* GRID RINGKASAN HASIL PENDATAAN KAMAR & PENGHUNI */}
                                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                                                    {/* Total Kamar */}
                                                    <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-2xs flex items-center gap-3.5 hover:shadow-xs transition-all">
                                                        <span className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                                                            <DoorClosed size={20}/>
                                                        </span>
                                                        <div className="min-w-0">
                                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block truncate">
                                                                Total Kamar
                                                            </span>
                                                            <h4 className="text-lg font-black text-slate-900 leading-tight">
                                                                {totalRooms} <span className="text-xs text-slate-500 font-bold">Unit</span>
                                                            </h4>
                                                            <span className="text-[10px] font-bold text-blue-600">Semua Tipe Kamar</span>
                                                        </div>
                                                    </div>

                                                    {/* Kamar Terisi */}
                                                    <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-2xs flex items-center gap-3.5 hover:shadow-xs transition-all">
                                                        <span className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                                                            <Lock size={20}/>
                                                        </span>
                                                        <div className="min-w-0">
                                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block truncate">
                                                                Kamar Terisi
                                                            </span>
                                                            <h4 className="text-lg font-black text-amber-600 leading-tight">
                                                                {occupiedRooms} <span className="text-xs text-slate-500 font-bold">Unit</span>
                                                            </h4>
                                                            <span className="text-[10px] font-bold text-amber-700">Sedang Dihuni</span>
                                                        </div>
                                                    </div>

                                                    {/* Kamar Kosong */}
                                                    <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-2xs flex items-center gap-3.5 hover:shadow-xs transition-all">
                                                        <span className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                                                            <Sparkles size={20}/>
                                                        </span>
                                                        <div className="min-w-0">
                                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block truncate">
                                                                Kamar Kosong
                                                            </span>
                                                            <h4 className="text-lg font-black text-emerald-600 leading-tight">
                                                                {availableRooms} <span className="text-xs text-slate-500 font-bold">Unit</span>
                                                            </h4>
                                                            <span className="text-[10px] font-bold text-emerald-700">Siap Pasarkan</span>
                                                        </div>
                                                    </div>

                                                    {/* Total Penghuni */}
                                                    <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-2xs flex items-center gap-3.5 hover:shadow-xs transition-all">
                                                        <span className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                                                            <Users size={20}/>
                                                        </span>
                                                        <div className="min-w-0">
                                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block truncate">
                                                                Total Penghuni
                                                            </span>
                                                            <h4 className="text-lg font-black text-indigo-600 leading-tight">
                                                                {totalOccupants} <span className="text-xs text-slate-500 font-bold">Orang</span>
                                                            </h4>
                                                            <span className="text-[10px] font-bold text-indigo-700">Penyewa Terdata</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* CAROUSEL GALERI FOTO SELURUH KAMAR & FILTER PER-KAMAR */}
                                                {(() => {
                                                    const allRoomPhotosWithMetadata: { url: string; label: string; roomName: string; rtIdx: number }[] = [];
                                                    const eligibleRoomsForFilter: { rt: any; idx: number; rName: string; photosCount: number; isValid: boolean }[] = [];
                                                    let unitPhotoCounter = 0;

                                                    groupedRoomTypes.forEach((gt: any) => {
                                                        const allUnits = [...gt.vacantUnits, ...gt.occupiedUnits];
                                                        allUnits.forEach((u: any) => {
                                                            const uPhotos = getRoomPhotos(u);
                                                            const currentUnitIdx = unitPhotoCounter;
                                                            uPhotos.forEach(p => {
                                                                allRoomPhotosWithMetadata.push({
                                                                    ...p,
                                                                    roomName: u.name,
                                                                    rtIdx: currentUnitIdx
                                                                });
                                                            });
                                                            if (uPhotos.length > 0 && !u.isOccupied) {
                                                                eligibleRoomsForFilter.push({
                                                                    rt: u,
                                                                    idx: currentUnitIdx,
                                                                    rName: u.name,
                                                                    photosCount: uPhotos.length,
                                                                    isValid: true
                                                                });
                                                            }
                                                            unitPhotoCounter++;
                                                        });
                                                    });

                                                    const displayedRoomPhotos = selectedRoomGalleryFilter === 'all'
                                                        ? allRoomPhotosWithMetadata
                                                        : allRoomPhotosWithMetadata.filter(p => p.rtIdx === selectedRoomGalleryFilter);

                                                    const activePhotoIndex = displayedRoomPhotos.length > 0
                                                        ? Math.min(selectedRoomGalleryPhotoIndex, displayedRoomPhotos.length - 1)
                                                        : 0;
                                                    const currentActivePhoto = displayedRoomPhotos[activePhotoIndex] || null;

                                                    if (allRoomPhotosWithMetadata.length === 0) return null;

                                                    // Mencari info unit aktif untuk floating overlay
                                                    let activeUnitData: any = null;
                                                    if (currentActivePhoto) {
                                                        for (const gt of groupedRoomTypes) {
                                                            const found = [...gt.vacantUnits, ...gt.occupiedUnits].find(u => u.name === currentActivePhoto.roomName);
                                                            if (found) {
                                                                activeUnitData = found;
                                                                break;
                                                            }
                                                        }
                                                    }

                                                    const activeFacilities: string[] = activeUnitData ? [...(activeUnitData.facilities || []), ...(activeUnitData.bathroomFacilities || [])] : [];

                                                    return (
                                                        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs space-y-4">
                                                            {/* Header Galeri Foto Kamar */}
                                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                                                                <div className="flex items-center gap-2.5">
                                                                    <span className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-100 text-[#ff7a00] flex items-center justify-center shrink-0">
                                                                        <Camera size={18} />
                                                                    </span>
                                                                    <div>
                                                                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                                                                            Galeri Foto Kamar Hasil Pendataan
                                                                        </h3>
                                                                        <p className="text-[10px] text-slate-400 font-bold">
                                                                            {selectedRoomGalleryFilter === 'all'
                                                                                ? `Menampilkan seluruh ${allRoomPhotosWithMetadata.length} foto kamar yang terkumpul`
                                                                                : `Menampilkan foto terisolasi untuk ${currentActivePhoto?.roomName || 'Kamar'} (Klik ulang tombol untuk kembali)`}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-2 self-start sm:self-auto">
                                                                    <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-wider">
                                                                        {displayedRoomPhotos.length} Foto Tersedia
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {/* Hero Carousel Frame Display */}
                                                            {displayedRoomPhotos.length > 0 && currentActivePhoto ? (
                                                                <div className="space-y-3">
                                                                    {/* Main Hero Photo Box */}
                                                                    <div className="relative aspect-video sm:aspect-21/9 max-h-[360px] w-full rounded-2xl overflow-hidden bg-slate-950 group shadow-inner flex items-center justify-center">
                                                                        <img
                                                                            src={currentActivePhoto.url}
                                                                            alt={currentActivePhoto.label || 'Foto Kamar'}
                                                                            className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-[1.01]"
                                                                        />

                                                                        {/* Gradient Overlay for card contrast */}
                                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

                                                                        {/* Top Category Badge */}
                                                                        <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5 pointer-events-none">
                                                                            <span className="px-2.5 py-1 rounded-lg bg-[#ff7a00]/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1">
                                                                                <Camera size={11} />
                                                                                {currentActivePhoto.label || 'Foto Kamar'}
                                                                            </span>
                                                                        </div>

                                                                        {/* Floating Room Detail Card (Bottom-Left) */}
                                                                        <div className="absolute bottom-3 left-3 bg-black/75 backdrop-blur-sm rounded-xl p-3 text-white space-y-1 min-w-[180px] max-w-[280px] sm:max-w-none text-left z-10 pointer-events-none shadow-md border border-white/10">
                                                                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Nomor Kamar</p>
                                                                            <p className="text-base font-black leading-tight">{currentActivePhoto.roomName}</p>
                                                                            <p className="text-[10px] font-bold text-slate-300">{activeUnitData?.size || '3x4 meter'}</p>
                                                                            {activeUnitData?.price ? (
                                                                                <p className="text-sm font-black text-emerald-400">TARIF {FORMAT_CURRENCY(activeUnitData.price)}/bln</p>
                                                                            ) : null}
                                                                            {activeFacilities.length > 0 && (
                                                                                <div className="flex flex-wrap gap-1 pt-0.5">
                                                                                    {activeFacilities.slice(0, 3).map((f: string, i: number) => (
                                                                                        <span key={i} className="inline-block px-1.5 py-0.5 rounded bg-white/20 text-[9px] font-black text-white">{f}</span>
                                                                                    ))}
                                                                                </div>
                                                                            )}
                                                                        </div>

                                                                        {/* Photo Counter */}
                                                                        <div className="absolute top-3 right-3 pointer-events-none">
                                                                            <span className="px-2.5 py-1 rounded-lg bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-black tracking-widest shadow-sm">
                                                                                {activePhotoIndex + 1} / {displayedRoomPhotos.length}
                                                                            </span>
                                                                        </div>

                                                                        {/* Navigation Left / Right Buttons */}
                                                                        {displayedRoomPhotos.length > 1 && (
                                                                            <>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        setSelectedRoomGalleryPhotoIndex(prev => (prev > 0 ? prev - 1 : displayedRoomPhotos.length - 1));
                                                                                    }}
                                                                                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-slate-900/60 hover:bg-slate-900/90 text-white backdrop-blur-md flex items-center justify-center transition-all opacity-80 hover:opacity-100 hover:scale-110 z-20"
                                                                                >
                                                                                    <ChevronLeft size={20} />
                                                                                </button>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        setSelectedRoomGalleryPhotoIndex(prev => (prev < displayedRoomPhotos.length - 1 ? prev + 1 : 0));
                                                                                    }}
                                                                                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-slate-900/60 hover:bg-slate-900/90 text-white backdrop-blur-md flex items-center justify-center transition-all opacity-80 hover:opacity-100 hover:scale-110 z-20"
                                                                                >
                                                                                    <ChevronRight size={20} />
                                                                                </button>
                                                                            </>
                                                                        )}
                                                                    </div>

                                                                    {/* Horizontal Thumbnail Strip */}
                                                                    {displayedRoomPhotos.length > 1 && (
                                                                        <div className="flex gap-2.5 overflow-x-auto pb-1.5 scrollbar-thin">
                                                                            {displayedRoomPhotos.map((p, pIdx) => {
                                                                                const isThumbActive = pIdx === activePhotoIndex;
                                                                                return (
                                                                                    <button
                                                                                        key={pIdx}
                                                                                        type="button"
                                                                                        onClick={() => setSelectedRoomGalleryPhotoIndex(pIdx)}
                                                                                        className={`relative w-24 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all group cursor-pointer ${
                                                                                            isThumbActive
                                                                                                ? 'border-[#ff7a00] ring-2 ring-orange-400/30 scale-105 shadow-md'
                                                                                                : 'border-slate-200 opacity-65 hover:opacity-100'
                                                                                        }`}
                                                                                    >
                                                                                        <img
                                                                                            src={p.url}
                                                                                            alt={p.label}
                                                                                            className="w-full h-full object-cover"
                                                                                        />
                                                                                        {/* Tag Nomor Kamar (Jika Tampil Semua) */}
                                                                                        {selectedRoomGalleryFilter === 'all' && (
                                                                                            <span className="absolute top-1 left-1 bg-slate-900/85 text-[8px] font-black text-orange-300 px-1.5 py-0.2 rounded-md shadow-xs pointer-events-none">
                                                                                                {p.roomName}
                                                                                            </span>
                                                                                        )}
                                                                                        {/* Label Kategori Foto Fasilitas */}
                                                                                        <span className="absolute bottom-0 inset-x-0 bg-slate-900/85 backdrop-blur-xs text-white text-[8.5px] font-bold px-1.5 py-0.5 truncate text-center block">
                                                                                            {p.label || 'Foto Kamar'}
                                                                                        </span>
                                                                                    </button>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                                                    <Camera className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
                                                                    <p className="text-xs text-slate-500 font-bold">
                                                                        Belum ada foto yang diunggah untuk kamar ini.
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })()}

                                                {/* LIST TIPE KAMAR SEJATI (LEVEL 1 PARENT) */}
                                                {groupedRoomTypes.map((rt: any, rtIdx: number) => {
                                                    const isExpanded = Boolean(expandedRoomTypes[rtIdx]); // default minimized (false)
                                                    const occupiedKey = `rt${rtIdx}_occ`;
                                                    const availableKey = `rt${rtIdx}_avail`;

                                                    const isOccExpanded = Boolean(expandedStatusSections[occupiedKey]); // default minimized (false)
                                                    const isAvailExpanded = Boolean(expandedStatusSections[availableKey]); // default minimized (false)

                                                    return (
                                                        <div key={rt.id || rtIdx} className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                                                            {/* LEVEL 1: ACCORDION HEADER TIPE KAMAR (PARENT - TAMPILAN MINIMIZE & MAXIMIZE) */}
                                                            <button type="button"
                                                                onClick={() => {
                                                                    setSelectedRoomGalleryFilter('all');
                                                                    setExpandedRoomTypes(prev => ({...prev, [rtIdx]: !isExpanded}));
                                                                }}
                                                                className="w-full flex flex-col md:flex-row md:items-center justify-between p-5 hover:bg-slate-50 transition-colors text-left cursor-pointer gap-4">
                                                                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                                                                    <span className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100 shadow-2xs mt-0.5">
                                                                        <Bed size={20}/>
                                                                    </span>
                                                                    <div className="min-w-0 flex-1 space-y-1.5">
                                                                        <div className="flex items-center gap-2 flex-wrap">
                                                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tipe Kamar #{rtIdx + 1}</span>
                                                                        </div>
                                                                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{rt.name}</h4>
                                                                        {/* Specs & Full Facility Chips in Header (All facilities dynamically wrap without getting cut off) */}
                                                                        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                                                                            <span className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200/80 text-[10px] font-black text-blue-800 flex items-center gap-1 shadow-2xs">
                                                                                📐 {rt.size}
                                                                            </span>
                                                                            {rt.roomFacilities.map((f: string, fi: number) => (
                                                                                <span key={`rf_${fi}`} className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200/90 text-[10px] font-bold text-slate-700 shadow-2xs">
                                                                                    {f}
                                                                                </span>
                                                                            ))}
                                                                            {rt.bathroomFacilities.map((bf: string, bfi: number) => (
                                                                                <span key={`rbf_${bfi}`} className="px-2.5 py-1 rounded-lg bg-sky-50 border border-sky-200/90 text-[10px] font-bold text-sky-800 shadow-2xs">
                                                                                    {bf}
                                                                                </span>
                                                                            ))}
                                                                            {rt.kitchenFacilities.map((kf: string, kfi: number) => (
                                                                                <span key={`rkf_${kfi}`} className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200/90 text-[10px] font-bold text-amber-800 shadow-2xs">
                                                                                    {kf}
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                                                                    <span className="text-sm font-black text-emerald-700">{FORMAT_CURRENCY(rt.price)}<span className="text-[10px] text-slate-400 font-bold">/bln</span></span>
                                                                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">✨ {rt.vacantUnits.length} Kosong</span>
                                                                    <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black">🔒 {rt.occupiedUnits.length} Dihuni</span>
                                                                    {isExpanded ? <ChevronUp size={18} className="text-slate-400"/> : <ChevronDown size={18} className="text-slate-400"/>}
                                                                </div>
                                                            </button>

                                                            {/* LEVEL 2: BODY TIPE KAMAR (CHILDREN - LANGSUNG MENAMPILKAN TERISI & KOSONG) */}
                                                            {isExpanded && (
                                                                <div className="border-t border-slate-100 p-5 space-y-4">
                                                                    {/* DUA SUB-PARENT ACCORDIONS: 1. TERISI & 2. KOSONG (SELALU MUNCUL BERPASANGAN) */}
                                                                    <div className="space-y-3">
                                                                        {/* Sub-Parent 1: KAMAR TERISI */}
                                                                        <div className="rounded-2xl border border-amber-200 overflow-hidden bg-white shadow-2xs">
                                                                            <button type="button"
                                                                                onClick={() => setExpandedStatusSections(prev => ({...prev, [occupiedKey]: !isOccExpanded}))}
                                                                                className="w-full flex items-center justify-between p-4 bg-amber-50/80 hover:bg-amber-100/80 transition-colors text-left cursor-pointer">
                                                                                <div className="flex items-center gap-2.5">
                                                                                    <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-black text-sm shrink-0">
                                                                                        🔒
                                                                                    </span>
                                                                                    <div>
                                                                                        <span className="text-xs font-black text-amber-900 uppercase tracking-wide">KAMAR SEDANG DIHUNI / TERISI</span>
                                                                                        <span className="ml-2 px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px] font-black">{rt.occupiedUnits.length} UNIT</span>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="flex items-center gap-1 text-amber-700 text-[10px] font-black uppercase tracking-wider">
                                                                                    <span>{isOccExpanded ? 'TUTUP LIST' : 'BUKA LIST'}</span>
                                                                                    {isOccExpanded ? <ChevronUp size={15}/> : <ChevronDown size={15}/>}
                                                                                </div>
                                                                            </button>
                                                                            {isOccExpanded && (
                                                                                <div className="p-4 bg-amber-50/30 border-t border-amber-100 space-y-3">
                                                                                    {rt.occupiedUnits.length > 0 ? (
                                                                                        rt.occupiedUnits.map((u: any, uIdx: number) => {
                                                                                            const unitPhotos = getRoomPhotos(u);
                                                                                            const uRoomFacilities = (u.facilities && u.facilities.length > 0) ? u.facilities : (rt.roomFacilities || []);
                                                                                            const uBathFacilities = (u.bathroomFacilities && u.bathroomFacilities.length > 0) ? u.bathroomFacilities : (rt.bathroomFacilities || []);
                                                                                            const uKitchenFacilities = (u.kitchenFacilities && u.kitchenFacilities.length > 0) ? u.kitchenFacilities : (rt.kitchenFacilities || []);

                                                                                            return (
                                                                                                <div key={u.id || uIdx} className="bg-white border border-amber-200/90 rounded-2xl p-4 shadow-sm space-y-3.5 hover:border-amber-300 transition-all">
                                                                                                    {/* Top Bar: Room Name & Status */}
                                                                                                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-100/80 pb-2.5">
                                                                                                        <div className="flex items-center gap-2.5">
                                                                                                            <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-black text-sm">
                                                                                                                <Lock size={15} />
                                                                                                            </span>
                                                                                                            <div>
                                                                                                                <div className="flex items-center gap-1.5">
                                                                                                                    <span className="text-[9px] font-black text-amber-800 uppercase tracking-widest">UNIT KAMAR</span>
                                                                                                                    <span className="px-2 py-0.2 rounded-full bg-amber-100 border border-amber-200 text-amber-900 text-[9px] font-black uppercase">
                                                                                                                        🔒 Dihuni
                                                                                                                    </span>
                                                                                                                </div>
                                                                                                                <h5 className="text-sm font-black text-slate-900 leading-tight">{u.name}</h5>
                                                                                                            </div>
                                                                                                        </div>
                                                                                                        <div className="text-right">
                                                                                                            <span className="text-[9px] font-bold text-slate-400 block uppercase">Tarif Sewa</span>
                                                                                                            <span className="text-xs font-black text-emerald-700">{FORMAT_CURRENCY(u.price || rt.price)}<span className="text-[9px] text-slate-400 font-bold">/bln</span></span>
                                                                                                        </div>
                                                                                                    </div>

                                                                                                    {/* Grid Data Penghuni & Detail Sewa */}
                                                                                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-xs">
                                                                                                        {/* 1. Nama Penghuni */}
                                                                                                        <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-2.5">
                                                                                                            <span className="text-[9px] font-black text-amber-800 uppercase tracking-wider block mb-1">
                                                                                                                👤 Nama Penghuni
                                                                                                            </span>
                                                                                                            <p className="font-black text-slate-900 truncate">{u.residentName || '-'}</p>
                                                                                                            <span className="text-[10px] text-slate-500 font-semibold">{u.currentOccupants || 1} Orang Penghuni</span>
                                                                                                        </div>

                                                                                                        {/* 2. Kontak WhatsApp */}
                                                                                                        <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-2.5">
                                                                                                            <span className="text-[9px] font-black text-amber-800 uppercase tracking-wider block mb-1">
                                                                                                                📱 Kontak WhatsApp
                                                                                                            </span>
                                                                                                            <p className="font-black text-slate-900">{u.residentPhone || '-'}</p>
                                                                                                            {u.residentPhone && u.residentPhone !== '-' && (
                                                                                                                <a 
                                                                                                                    href={`https://wa.me/${u.residentPhone.replace(/\D/g, '')}`} 
                                                                                                                    target="_blank" 
                                                                                                                    rel="noreferrer" 
                                                                                                                    className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 hover:underline mt-0.5"
                                                                                                                >
                                                                                                                    Hubungi via WA ↗
                                                                                                                </a>
                                                                                                            )}
                                                                                                        </div>

                                                                                                        {/* 3. Periode & Tagihan */}
                                                                                                        <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-2.5 sm:col-span-2 md:col-span-1">
                                                                                                            <span className="text-[9px] font-black text-amber-800 uppercase tracking-wider block mb-1">
                                                                                                                📅 Periode &amp; Tagihan
                                                                                                            </span>
                                                                                                            <p className="font-bold text-slate-800 text-[11px]">
                                                                                                                Langganan: <span className="font-black capitalize">{u.paymentPeriod || 'Bulanan'}</span>
                                                                                                            </p>
                                                                                                            <div className="flex flex-col text-[10px] text-slate-600 font-semibold mt-0.5 space-y-0.5">
                                                                                                                {u.startDate && <span>Bayar Terakhir: <strong className="text-slate-800">{u.startDate}</strong></span>}
                                                                                                                {u.endDate && <span>Tagihan Berikutnya: <strong className="text-amber-800">{u.endDate}</strong></span>}
                                                                                                            </div>
                                                                                                        </div>
                                                                                                    </div>

                                                                                                    {/* Spesifikasi & Fasilitas Kamar Terpasang (Kamar Terisi) */}
                                                                                                    <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-2.5 space-y-1.5 text-xs">
                                                                                                        <div className="flex items-center justify-between">
                                                                                                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-wider">
                                                                                                                🛋️ Fasilitas &amp; Spesifikasi Terpasang
                                                                                                            </span>
                                                                                                            <span className="px-2 py-0.5 rounded bg-slate-200/70 text-[9px] font-black text-slate-700">
                                                                                                                📐 {u.size || rt.size || '3x4 meter'}
                                                                                                            </span>
                                                                                                        </div>
                                                                                                        <div className="flex flex-wrap gap-1 pt-0.5">
                                                                                                            {uRoomFacilities.map((f: string, fi: number) => (
                                                                                                                <span key={`f_${fi}`} className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[9.5px] font-bold text-slate-700">
                                                                                                                    {f}
                                                                                                                </span>
                                                                                                            ))}
                                                                                                            {uBathFacilities.map((bf: string, bfi: number) => (
                                                                                                                <span key={`bf_${bfi}`} className="px-1.5 py-0.5 bg-sky-50 border border-sky-200 rounded text-[9.5px] font-bold text-sky-800">
                                                                                                                    {bf}
                                                                                                                </span>
                                                                                                            ))}
                                                                                                            {uKitchenFacilities.map((kf: string, kfi: number) => (
                                                                                                                <span key={`kf_${kfi}`} className="px-1.5 py-0.5 bg-amber-50 border border-amber-200 rounded text-[9.5px] font-bold text-amber-800">
                                                                                                                    {kf}
                                                                                                                </span>
                                                                                                            ))}
                                                                                                            {uRoomFacilities.length === 0 && uBathFacilities.length === 0 && uKitchenFacilities.length === 0 && (
                                                                                                                <span className="text-[10px] text-slate-400 italic">Fasilitas standar tipe kamar</span>
                                                                                                            )}
                                                                                                        </div>
                                                                                                    </div>

                                                                                                    {/* Dokumentasi Foto Unit Kamar (Dinamis) */}
                                                                                                    {unitPhotos.length > 0 ? (
                                                                                                        <div className="bg-amber-50/40 border border-amber-100 rounded-xl p-2.5 space-y-2">
                                                                                                            <div className="flex items-center justify-between">
                                                                                                                <span className="text-[9px] font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                                                                                                                    <Camera size={13} className="text-amber-700" />
                                                                                                                    Foto Dokumentasi Unit ({unitPhotos.length})
                                                                                                                </span>
                                                                                                                <span className="text-[9px] font-bold text-slate-400">Hasil Survey</span>
                                                                                                            </div>
                                                                                                            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                                                                                                                {unitPhotos.map((photo: any, pi: number) => (
                                                                                                                    <a
                                                                                                                        key={pi}
                                                                                                                        href={photo.url}
                                                                                                                        target="_blank"
                                                                                                                        rel="noopener noreferrer"
                                                                                                                        className="relative w-20 h-14 sm:w-24 sm:h-16 rounded-lg overflow-hidden shrink-0 border border-amber-200 hover:border-amber-500 transition-all group cursor-pointer shadow-2xs block"
                                                                                                                    >
                                                                                                                        <img
                                                                                                                            src={photo.url}
                                                                                                                            alt={photo.label || `Foto ${u.name}`}
                                                                                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                                                                                                        />
                                                                                                                        {photo.label && (
                                                                                                                            <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-xs py-0.5 px-1 text-[8px] text-white font-bold truncate text-center">
                                                                                                                                {photo.label}
                                                                                                                            </div>
                                                                                                                        )}
                                                                                                                    </a>
                                                                                                                ))}
                                                                                                            </div>
                                                                                                        </div>
                                                                                                    ) : (
                                                                                                        <div className="bg-slate-50/60 border border-dashed border-slate-200 rounded-xl p-2.5 flex items-center gap-2 text-slate-400">
                                                                                                            <Camera size={14} className="text-slate-400 shrink-0" />
                                                                                                            <span className="text-[10px] font-semibold italic">
                                                                                                                Dokumentasi Foto: Tidak tersedia (Privasi penghuni / belum diunggah)
                                                                                                            </span>
                                                                                                        </div>
                                                                                                    )}

                                                                                                    {/* Additional Occupants (Jika ada) */}
                                                                                                    {u.additionalOccupants && u.additionalOccupants.length > 0 && (
                                                                                                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 space-y-1.5">
                                                                                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">
                                                                                                                👥 Anggota Penghuni Tambahan ({u.additionalOccupants.length})
                                                                                                            </span>
                                                                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                                                                                {u.additionalOccupants.map((occ: any, oi: number) => (
                                                                                                                    <div key={oi} className="bg-white border border-slate-200 rounded-lg p-2 flex items-center justify-between text-xs">
                                                                                                                        <span className="font-black text-slate-800">{occ.name || `Anggota ${oi + 2}`}</span>
                                                                                                                        <span className="text-[10px] font-bold text-slate-500">{occ.phone || '-'}</span>
                                                                                                                    </div>
                                                                                                                ))}
                                                                                                            </div>
                                                                                                        </div>
                                                                                                    )}

                                                                                                    {/* Surveyor Notes (Jika ada) */}
                                                                                                    {u.notes && (
                                                                                                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs">
                                                                                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-0.5">
                                                                                                                📝 Catatan Pendataan Surveyor
                                                                                                            </span>
                                                                                                            <p className="text-slate-700 italic font-medium">{u.notes}</p>
                                                                                                        </div>
                                                                                                    )}
                                                                                                </div>
                                                                                            );
                                                                                        })
                                                                                    ) : (
                                                                                        <div className="p-4 bg-white rounded-xl border border-dashed border-amber-200 text-center text-xs font-bold text-amber-800">
                                                                                            Tidak ada unit kamar yang sedang dihuni pada tipe ini.
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            )}
                                                                        </div>

                                                                        {/* Sub-Parent 2: KAMAR KOSONG */}
                                                                        <div className="rounded-2xl border border-emerald-200 overflow-hidden bg-white shadow-2xs">
                                                                            <button type="button"
                                                                                onClick={() => setExpandedStatusSections(prev => ({...prev, [availableKey]: !isAvailExpanded}))}
                                                                                className="w-full flex items-center justify-between p-4 bg-emerald-50/80 hover:bg-emerald-100/80 transition-colors text-left cursor-pointer">
                                                                                <div className="flex items-center gap-2.5">
                                                                                    <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-sm shrink-0">
                                                                                        ✨
                                                                                    </span>
                                                                                    <div>
                                                                                        <span className="text-xs font-black text-emerald-900 uppercase tracking-wide">KAMAR KOSONG / SIAP HUNI</span>
                                                                                        <span className="ml-2 px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 text-[10px] font-black">{rt.vacantUnits.length} UNIT</span>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="flex items-center gap-1 text-emerald-700 text-[10px] font-black uppercase tracking-wider">
                                                                                    <span>{isAvailExpanded ? 'TUTUP LIST' : 'BUKA LIST'}</span>
                                                                                    {isAvailExpanded ? <ChevronUp size={15}/> : <ChevronDown size={15}/>}
                                                                                </div>
                                                                            </button>
                                                                            {isAvailExpanded && (
                                                                                <div className="p-4 bg-emerald-50/30 border-t border-emerald-100 space-y-3">
                                                                                    {rt.vacantUnits.length > 0 ? (
                                                                                        rt.vacantUnits.map((u: any, uIdx: number) => {
                                                                                            const unitPhotos = getRoomPhotos(u);
                                                                                            const uRoomFacilities = (u.facilities && u.facilities.length > 0) ? u.facilities : (rt.roomFacilities || ['Kosongan (Tanpa Perabot)']);
                                                                                            const uBathFacilities = (u.bathroomFacilities && u.bathroomFacilities.length > 0) ? u.bathroomFacilities : (rt.bathroomFacilities || []);
                                                                                            const uKitchenFacilities = (u.kitchenFacilities && u.kitchenFacilities.length > 0) ? u.kitchenFacilities : (rt.kitchenFacilities || []);

                                                                                            return (
                                                                                                <div key={u.id || uIdx} className="bg-white border border-emerald-200/90 rounded-2xl p-4 shadow-sm space-y-3.5 hover:border-emerald-300 transition-all">
                                                                                                    {/* Top Bar: Room Name & Status */}
                                                                                                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-100/80 pb-2.5">
                                                                                                        <div className="flex items-center gap-2.5">
                                                                                                            <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-sm">
                                                                                                                <Sparkles size={15} />
                                                                                                            </span>
                                                                                                            <div>
                                                                                                                <div className="flex items-center gap-1.5">
                                                                                                                    <span className="text-[9px] font-black text-emerald-800 uppercase tracking-widest">UNIT KAMAR</span>
                                                                                                                    <span className="px-2 py-0.2 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-900 text-[9px] font-black uppercase">
                                                                                                                        ✨ Siap Huni
                                                                                                                    </span>
                                                                                                                </div>
                                                                                                                <h5 className="text-sm font-black text-slate-900 leading-tight">{u.name}</h5>
                                                                                                            </div>
                                                                                                        </div>
                                                                                                        <div className="text-right">
                                                                                                            <span className="text-[9px] font-bold text-slate-400 block uppercase">Tarif Sewa</span>
                                                                                                            <span className="text-xs font-black text-emerald-700">{FORMAT_CURRENCY(u.price || rt.price)}<span className="text-[9px] text-slate-400 font-bold">/bln</span></span>
                                                                                                        </div>
                                                                                                    </div>

                                                                                                    {/* Grid Spesifikasi Kamar & Kelengkapan */}
                                                                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                                                                                                        {/* 1. Dimensi Kamar */}
                                                                                                        <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-2.5">
                                                                                                            <span className="text-[9px] font-black text-emerald-800 uppercase tracking-wider block mb-1">
                                                                                                                📐 Ukuran Kamar
                                                                                                            </span>
                                                                                                            <p className="font-black text-slate-900">{u.size || rt.size || '3x4 meter'}</p>
                                                                                                            <span className="text-[10px] text-slate-500 font-semibold">Ruangan Kosong</span>
                                                                                                        </div>

                                                                                                        {/* 2. Kelengkapan Kamar */}
                                                                                                        <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-2.5 sm:col-span-2">
                                                                                                            <span className="text-[9px] font-black text-emerald-800 uppercase tracking-wider block mb-1">
                                                                                                                🛋️ Fasilitas Terpasang
                                                                                                            </span>
                                                                                                            <div className="flex flex-wrap gap-1">
                                                                                                                {uRoomFacilities.map((f: string, fi: number) => (
                                                                                                                    <span key={fi} className="px-1.5 py-0.5 bg-white border border-emerald-200 rounded text-[9.5px] font-bold text-emerald-900">
                                                                                                                        {f}
                                                                                                                    </span>
                                                                                                                ))}
                                                                                                                {uBathFacilities.map((bf: string, bfi: number) => (
                                                                                                                    <span key={`bf_${bfi}`} className="px-1.5 py-0.5 bg-sky-50 border border-sky-200 rounded text-[9.5px] font-bold text-sky-900">
                                                                                                                        {bf}
                                                                                                                    </span>
                                                                                                                ))}
                                                                                                                {uKitchenFacilities.map((kf: string, kfi: number) => (
                                                                                                                    <span key={`kf_${kfi}`} className="px-1.5 py-0.5 bg-amber-50 border border-amber-200 rounded text-[9.5px] font-bold text-amber-900">
                                                                                                                        {kf}
                                                                                                                    </span>
                                                                                                                ))}
                                                                                                            </div>
                                                                                                        </div>
                                                                                                    </div>

                                                                                                    {/* Dokumentasi Foto Unit Kamar (Dinamis) */}
                                                                                                    {unitPhotos.length > 0 ? (
                                                                                                        <div className="bg-emerald-50/40 border border-emerald-100 rounded-xl p-2.5 space-y-2">
                                                                                                            <div className="flex items-center justify-between">
                                                                                                                <span className="text-[9px] font-black text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                                                                                                                    <Camera size={13} className="text-emerald-700" />
                                                                                                                    Foto Dokumentasi Unit ({unitPhotos.length})
                                                                                                                </span>
                                                                                                                <span className="text-[9px] font-bold text-slate-400">Hasil Survey</span>
                                                                                                            </div>
                                                                                                            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                                                                                                                {unitPhotos.map((photo: any, pi: number) => (
                                                                                                                    <a
                                                                                                                        key={pi}
                                                                                                                        href={photo.url}
                                                                                                                        target="_blank"
                                                                                                                        rel="noopener noreferrer"
                                                                                                                        className="relative w-20 h-14 sm:w-24 sm:h-16 rounded-lg overflow-hidden shrink-0 border border-emerald-200 hover:border-emerald-500 transition-all group cursor-pointer shadow-2xs block"
                                                                                                                    >
                                                                                                                        <img
                                                                                                                            src={photo.url}
                                                                                                                            alt={photo.label || `Foto ${u.name}`}
                                                                                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                                                                                                        />
                                                                                                                        {photo.label && (
                                                                                                                            <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-xs py-0.5 px-1 text-[8px] text-white font-bold truncate text-center">
                                                                                                                                {photo.label}
                                                                                                                            </div>
                                                                                                                        )}
                                                                                                                    </a>
                                                                                                                ))}
                                                                                                            </div>
                                                                                                        </div>
                                                                                                    ) : (
                                                                                                        <div className="bg-slate-50/60 border border-dashed border-slate-200 rounded-xl p-2.5 flex items-center gap-2 text-slate-400">
                                                                                                            <Camera size={14} className="text-slate-400 shrink-0" />
                                                                                                            <span className="text-[10px] font-semibold italic">
                                                                                                                Dokumentasi Foto: Belum ada foto terunggah untuk unit ini
                                                                                                            </span>
                                                                                                        </div>
                                                                                                    )}

                                                                                                    {/* Surveyor Notes (Jika ada) */}
                                                                                                    {u.notes && (
                                                                                                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs">
                                                                                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-0.5">
                                                                                                                📝 Catatan Kondisi Kamar
                                                                                                            </span>
                                                                                                            <p className="text-slate-700 italic font-medium">{u.notes}</p>
                                                                                                        </div>
                                                                                                    )}
                                                                                                </div>
                                                                                            );
                                                                                        })
                                                                                    ) : (
                                                                                        <div className="p-4 bg-white rounded-xl border border-dashed border-emerald-200 text-center text-xs font-bold text-emerald-800">
                                                                                            Seluruh unit pada tipe kamar ini sedang terisi (0 kamar kosong).
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
                                                })}
                                            </div>
                                        );
                                    })()}

                                    {/* ================= TAB 3: DATA MITRA & KERJASAMA ================= */}
                                    {reviewActiveTab === 'legal' && (
                                        <div className="space-y-6 animate-in fade-in duration-300">
                                            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-4 shadow-2xs">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
                                                    <div>
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Dokumen Perjanjian Kemitraan</span>
                                                        <h4 className="text-base font-black text-slate-900 uppercase tracking-tight">
                                                            Salinan Syarat &amp; Ketentuan Penggunaan KostManager (Auto-Pilot)
                                                        </h4>
                                                    </div>
                                                    <span className="self-start sm:self-auto px-3 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-2xs">
                                                        <Check size={12} className="text-emerald-700"/> Disetujui Mitra Secara Digital
                                                    </span>
                                                </div>
                                                <div className="bg-white p-5 rounded-2xl border border-slate-200 text-xs text-slate-700 space-y-3.5 leading-relaxed max-h-72 overflow-y-auto font-medium shadow-inner">
                                                    <p className="font-bold text-slate-900 text-xs pb-1 border-b border-slate-100">Perjanjian Pengelolaan Properti Kos &amp; Layanan Manajemen KostManager RuangSinggah:</p>
                                                    <div className="space-y-1">
                                                        <p className="font-bold text-slate-900 text-xs">1. Mekanisme &amp; Otorisasi Pengelolaan Auto-Pilot</p>
                                                        <p className="text-[11px] text-slate-600">Mitra Pemilik Kos memberikan hak dan wewenang eksklusif kepada platform RuangSinggah untuk mengelola pencatatan reservasi, publikasi listing properti, penerimaan calon penghuni, serta penagihan otomatis biaya sewa bulanan kamar sesuai data yang diverifikasi.</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="font-bold text-slate-900 text-xs">2. Akurasi &amp; Validitas Data Lapangan</p>
                                                        <p className="text-[11px] text-slate-600">Mitra bertanggung jawab penuh atas kebenaran seluruh informasi properti, tarif sewa kamar, spesifikasi fasilitas, serta ketersediaan unit kamar yang didata bersama agen surveyor lapangan RuangSinggah.</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="font-bold text-slate-900 text-xs">3. Penyaluran Hasil Sewa &amp; Transparansi Keuangan</p>
                                                        <p className="text-[11px] text-slate-600">Seluruh transaksi pembayaran sewa penghuni diproses melalui rekening penampung resmi platform dan disalurkan secara transparan dan berkala ke rekening terdaftar Mitra dengan laporan keuangan real-time pada portal KostManager.</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="font-bold text-slate-900 text-xs">4. Legalitas Kepemilikan &amp; Hak Pengelolaan</p>
                                                        <p className="text-[11px] text-slate-600">Mitra menyatakan dan menjamin bahwa properti yang didaftarkan berstatus sah secara hukum, tidak dalam sengketa, dan memiliki izin operasional pemondokan / rumah kos sesuai perundang-undangan yang berlaku.</p>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                                                    {['Persetujuan Program Auto-Pilot', 'Kebenaran Hak Kelola Properti', 'Otorisasi Pemasaran RuangSinggah'].map((item, i) => (
                                                        <div key={i} className="bg-white p-3.5 rounded-2xl border border-slate-200 flex items-center gap-3">
                                                            <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-xs shrink-0"><Check size={12}/></span>
                                                            <span className="text-[11px] font-bold text-slate-800 leading-tight">{item}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-3.5 shadow-2xs">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Tanda Tangan Digital Pemilik / Mitra</span>
                                                        <span className="text-[10px] font-bold text-slate-500">Mitra: <strong className="text-slate-900">{reviewRequest.user?.name || reviewRequest.owner_name || 'Mitra Kost'}</strong></span>
                                                    </div>
                                                    {reviewSurvey?.signature_data ? (
                                                        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-inner flex flex-col items-center justify-center min-h-[170px]">
                                                            <img src={reviewSurvey.signature_data} alt="Tanda Tangan Digital Pemilik" className="max-h-36 max-w-full object-contain"/>
                                                            <div className="mt-2 text-[9px] font-mono text-slate-400">Digital Signature Verified</div>
                                                        </div>
                                                    ) : (
                                                        <div className="bg-white p-8 rounded-2xl border border-dashed border-slate-300 text-center text-slate-400 text-xs font-bold flex flex-col items-center justify-center min-h-[170px] gap-2">
                                                            <Layers size={32} className="text-slate-300"/>
                                                            <span>Tanda tangan digital belum terlampir saat pendataan.</span>
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-2 text-[10px] text-emerald-900 font-bold bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                                                        <Check size={14} className="text-emerald-600 shrink-0"/>
                                                        <span>Terverifikasi dan disahkan secara digital pada saat pendataan lapangan</span>
                                                    </div>
                                                </div>

                                                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-4 shadow-2xs flex flex-col justify-between">
                                                    <div className="space-y-3">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Metadata Pengesahan &amp; Surveyor</span>
                                                        <div className="space-y-2.5 text-xs font-bold text-slate-700">
                                                            <div className="p-3 bg-white rounded-xl border border-slate-200 flex justify-between items-center">
                                                                <span className="text-[10px] font-black text-slate-400 uppercase">Petugas Survey Lapangan</span>
                                                                <span className="text-slate-900 font-black">{reviewRequest.agent_name || 'Agen RuangSinggah'}</span>
                                                            </div>
                                                            <div className="p-3 bg-white rounded-xl border border-slate-200 flex justify-between items-center">
                                                                <span className="text-[10px] font-black text-slate-400 uppercase">Waktu Pengajuan / Survey</span>
                                                                <span className="text-slate-900 font-bold">{new Date(reviewRequest.created_at).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}</span>
                                                            </div>
                                                            <div className="p-3 bg-white rounded-xl border border-slate-200 flex justify-between items-center">
                                                                <span className="text-[10px] font-black text-slate-400 uppercase">Status Kelayakan Data</span>
                                                                <span className="text-emerald-700 font-black flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> LENGKAP &amp; SIAP ONBOARDING</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {(reviewSurvey?.result_drive_link || reviewRequest.result_drive_link) && (
                                                        <a href={reviewSurvey?.result_drive_link || reviewRequest.result_drive_link}
                                                            target="_blank" rel="noopener noreferrer"
                                                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-sm">
                                                            <FolderOpen size={16}/>
                                                            Buka Dokumen &amp; Berkas di Google Drive
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Sticky Action Footer */}
                        <div className="p-4 sm:p-6 bg-slate-50 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0">
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <button
                                    type="button"
                                    onClick={() => setReviewModalOpen(false)}
                                    className="px-5 py-3 rounded-2xl bg-white border border-gray-200 text-gray-700 font-black text-xs uppercase tracking-wider hover:bg-gray-100 transition-colors w-full sm:w-auto"
                                >
                                    Tutup
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setReviewModalOpen(false);
                                        setEditingRequest(reviewRequest);
                                        setEditForm({
                                            assigned_agent_id: reviewRequest.assigned_agent_id || '',
                                            result_drive_link: reviewRequest.result_drive_link || ''
                                        });
                                    }}
                                    className="px-4 py-3 rounded-2xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-black text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5 w-full sm:w-auto justify-center"
                                >
                                    ✏️ Edit Penugasan / Link
                                </button>
                            </div>

                            {reviewRequest.status !== 'ACTIVE' ? (
                                <button
                                    type="button"
                                    disabled={isSubmitting}
                                    onClick={() => handleApproveAndActivate(reviewRequest, reviewProperty)}
                                    className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-200 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    🚀 {isSubmitting ? 'Mengaktifkan...' : 'Setujui & Aktifkan Layanan Auto-Pilot (LIVE)'}
                                </button>
                            ) : (
                                <div className="px-4 py-2 bg-green-100 border border-green-200 text-green-900 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                                    <Check size={14}/> Layanan Sedang Aktif di Platform
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* LIGHTBOX FULLSCREEN PHOTO VIEWER */}
            {lightboxPhoto && (
                <div className="fixed inset-0 z-[150] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in" onClick={() => setLightboxPhoto(null)}>
                    <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center" onClick={e => e.stopPropagation()}>
                        <img 
                            src={lightboxPhoto.url} 
                            alt={lightboxPhoto.label} 
                            className="max-w-full max-h-[80vh] rounded-2xl object-contain shadow-2xl border border-white/10" 
                        />
                        <div className="mt-3 flex items-center justify-between w-full text-white px-2">
                            <span className="text-sm font-black uppercase tracking-wider">{lightboxPhoto.label}</span>
                            <button
                                type="button"
                                onClick={() => setLightboxPhoto(null)}
                                className="px-4 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-full text-xs font-black uppercase tracking-wider transition-colors"
                            >
                                Tutup ✕
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MITRA DETAIL POPUP MODAL */}
            {isMitraModalOpen && selectedMitra && (
                <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
                    <div className="absolute inset-0" onClick={() => setIsMitraModalOpen(false)}></div>
                    <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl relative z-10 p-8 animate-in zoom-in-95 flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Detail Profil Mitra</h3>
                            <button onClick={() => setIsMitraModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl font-bold">&times;</button>
                        </div>
                        <div className="space-y-4 text-sm font-bold text-gray-600">
                            <div>
                                <span className="text-[9px] font-black text-gray-400 tracking-wider uppercase block">Nama Mitra</span>
                                <span className="text-gray-900 font-black text-base">{selectedMitra.name || selectedMitra.full_name || '-'}</span>
                            </div>
                            <div>
                                <span className="text-[9px] font-black text-gray-400 tracking-wider uppercase block">No. WhatsApp</span>
                                <a 
                                    href={`https://wa.me/${(selectedMitra.phone || '').replace(/[^0-9]/g, '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-orange-600 font-black text-base hover:underline block"
                                >
                                    {selectedMitra.phone || '-'}
                                </a>
                            </div>
                            <div>
                                <span className="text-[9px] font-black text-gray-400 tracking-wider uppercase block">Alamat Email</span>
                                <span className="text-gray-900 block font-bold">{selectedMitra.email || '-'}</span>
                            </div>
                            {selectedMitra.business_name && (
                                <div>
                                    <span className="text-[9px] font-black text-gray-400 tracking-wider uppercase block">Nama Bisnis / Instansi</span>
                                    <span className="text-gray-900 block font-bold">{selectedMitra.business_name}</span>
                                </div>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsMitraModalOpen(false)}
                            className="mt-6 w-full py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-2xl text-xs font-black uppercase tracking-widest active:scale-95 transition-all"
                        >
                            Tutup
                        </button>
                    </div>
                </div>
            )}

            {/* EDIT ASSIGNMENT MODAL */}
            {editingRequest && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="absolute inset-0" onClick={() => setEditingRequest(null)}></div>
                    <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl relative z-10 p-8 animate-in zoom-in-95 flex flex-col max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6 shrink-0">
                            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Kelola KostManager</h3>
                            <button onClick={() => setEditingRequest(null)} className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-500 flex items-center justify-center border border-slate-200 transition-colors text-lg font-bold">&times;</button>
                        </div>

                        {/* Detail Informasi Pendaftaran (Read-only) */}
                        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-xs font-bold uppercase text-slate-500 mb-6 space-y-4 shrink-0">
                            <h4 className="text-[10px] font-black text-slate-400 tracking-wider">Detail Pendaftaran Pengaju</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left normal-case">
                                <div>
                                    <span className="text-[9px] font-black text-slate-400 tracking-wider uppercase block">Nama Mitra</span>
                                    <span className="text-slate-800 font-black text-orange-600">{editingRequest.user?.name || '-'}</span>
                                </div>
                                <div>
                                    <span className="text-[9px] font-black text-slate-400 tracking-wider uppercase block">No. Telepon Mitra</span>
                                    <span className="text-slate-800 font-bold">{editingRequest.user?.phone || editingRequest.owner_phone || '-'}</span>
                                </div>
                                <div>
                                    <span className="text-[9px] font-black text-slate-400 tracking-wider uppercase block">Nama Properti</span>
                                    <span className="text-slate-800 font-black">{editingRequest.kost_name}</span>
                                </div>
                                <div>
                                    <span className="text-[9px] font-black text-slate-400 tracking-wider uppercase block">Tipe Kost</span>
                                    <span className="text-slate-800 font-bold">{editingRequest.kost_type || '-'} ({editingRequest.empty_rooms || 0} Kamar Kosong)</span>
                                </div>
                                <div className="sm:col-span-2">
                                    <span className="text-[9px] font-black text-slate-400 tracking-wider uppercase block">Alamat Kost</span>
                                    <span className="text-slate-800 font-medium leading-relaxed">{editingRequest.kost_address}</span>
                                </div>
                                <div>
                                    <span className="text-[9px] font-black text-slate-400 tracking-wider uppercase block">Metode Pembayaran</span>
                                    <span className="text-slate-800 font-bold">{editingRequest.transaction?.payment_method || 'TRANSFER (MIDTRANS)'}</span>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleUpdateStatusAndAgent} className="space-y-6 flex-1">
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Tugaskan Agen Survey</label>
                                <select
                                    value={editForm.assigned_agent_id}
                                    onChange={e => setEditForm({ ...editForm, assigned_agent_id: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-orange-500/20"
                                >
                                    <option value="">-- Pilih Agen --</option>
                                    {agents.map(agent => (
                                        <option key={agent.id} value={agent.id}>{agent.name} ({agent.phone})</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Link Folder Google Drive Hasil Konten</label>
                                    {!editForm.result_drive_link && (
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                setIsSubmitting(true);
                                                try {
                                                    const link = await generateManualDriveFolder(editingRequest.id);
                                                    setEditForm({ ...editForm, result_drive_link: link });
                                                    alert('Folder Google Drive berhasil dibuat!');
                                                } catch (err) {
                                                    alert('Gagal membuat folder: ' + (err as Error).message);
                                                } finally {
                                                    setIsSubmitting(false);
                                                }
                                            }}
                                            className="text-[9px] font-black text-orange-600 uppercase tracking-wider hover:underline"
                                        >
                                            ⚙️ Buat Folder Otomatis
                                        </button>
                                    )}
                                </div>
                                <input
                                    type="text"
                                    value={editForm.result_drive_link}
                                    onChange={e => setEditForm({ ...editForm, result_drive_link: e.target.value })}
                                    placeholder="https://drive.google.com/..."
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-orange-500/20"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-orange-100 active:scale-95 transition-all mt-6 disabled:opacity-50"
                            >
                                {isSubmitting ? 'Menyimpan...' : 'Simpan Penugasan & Link'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default KostManagerManagement;
