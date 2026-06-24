import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate, useParams } from 'react-router-dom';
import { supabase } from './supabase';
import { Page, Kost } from './types';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import { getPublishedProperties, getPublishedPropertyDetails, ensureAbsoluteUrl } from './userService';

// Code splitting: semua page selain Home dimuat on-demand (lazy)
const Listings = lazy(() => import('./pages/Listings'));
const Products = lazy(() => import('./pages/Products'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const Owner = lazy(() => import('./pages/Owner'));
const Login = lazy(() => import('./pages/Login'));
const Profile = lazy(() => import('./pages/Profile'));
const KostDetail = lazy(() => import('./pages/KostDetail'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const SurveyService = lazy(() => import('./pages/SurveyService'));
const SurveyCheckout = lazy(() => import('./pages/SurveyCheckout'));
const MyKost = lazy(() => import('./pages/MyKost'));
const Chat = lazy(() => import('./pages/Chat'));
const MitraDashboard = lazy(() => import('./pages/MitraDashboard'));
const OrderPaymentStatus = lazy(() => import('./pages/OrderPaymentStatus'));
const Terms = lazy(() => import('./pages/Terms'));
const Articles = lazy(() => import('./pages/Articles'));
const KostManagerLanding = lazy(() => import('./pages/KostManagerLanding'));

// Loading fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
      <p className="text-sm text-gray-400 font-medium">Memuat halaman...</p>
    </div>
  </div>
);


// Deteksi redirect dari magic link upgrade role (dibaca dinamis agar akurat pasca loading)
const getIsUpgradeConfirmation = () => window.location.search.includes('upgrade_to_owner=true');
const getIsSignupConfirmation = () => {
  const hash = window.location.hash;
  const search = window.location.search;
  return hash.includes('type=signup') ||
    search.includes('type=signup') ||
    (search.includes('code=') &&
     !search.includes('mode=recovery') &&
     !search.includes('upgrade_to_owner'));
};

// --- PRE-MOUNT UPGRADE HANDLER ---
// Menangani upgrade secara global sebelum React melakukan routing, guna menghindari collision auth state.
if (getIsUpgradeConfirmation()) {
  localStorage.setItem('upgrade_in_progress', 'true');
  const searchParams = new URLSearchParams(window.location.search);
  
  const checkAndUpgrade = async () => {
    try {
      console.log('[Pre-Mount Upgrade] Initializing session check...');
      
      // Berikan waktu 500ms agar Supabase Client selesai mengurai hash (#access_token) dari URL ke memory
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        console.log('[Pre-Mount Upgrade] Session detected for user:', session.user.email);
        
        // Bersihkan parameter URL di browser agar bersih dari token/code
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Jalankan update database
        const { error: updateErr } = await supabase
          .from('users')
          .update({ role: 'owner' })
          .eq('id', session.user.id);
          
        if (updateErr) {
          console.error('[Pre-Mount Upgrade] DB Update error:', updateErr.message);
        } else {
          console.log('[Pre-Mount Upgrade] DB Update success. User role is now OWNER.');
        }
        
        // Sign out agar tidak memicu auto-login dengan data role lama di memory client
        await supabase.auth.signOut();
        console.log('[Pre-Mount Upgrade] Sign out complete.');
        
        localStorage.removeItem('upgrade_in_progress');
        window.location.href = window.location.origin + '/login?upgrade_success=true';
      } else {
        console.warn('[Pre-Mount Upgrade] Session not found immediately. Attaching onAuthStateChange listener...');
        
        // Daftarkan listener transisi jika session belum siap
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
          console.log('[Pre-Mount Upgrade Listener] Event triggered:', event);
          if (event === 'SIGNED_IN' && newSession?.user) {
            subscription.unsubscribe();
            window.history.replaceState({}, document.title, window.location.pathname);
            
            console.log('[Pre-Mount Upgrade Listener] User signed in, updating role to owner in DB...');
            await supabase.from('users').update({ role: 'owner' }).eq('id', newSession.user.id);
            await supabase.auth.signOut();
            
            localStorage.removeItem('upgrade_in_progress');
            window.location.href = window.location.origin + '/login?upgrade_success=true';
          }
        });
        
        // Timeout pengaman (jika link kadaluwarsa / session kosong)
        setTimeout(() => {
          subscription.unsubscribe();
          if (localStorage.getItem('upgrade_in_progress') === 'true') {
            localStorage.removeItem('upgrade_in_progress');
            console.warn('[Pre-Mount Upgrade] Timeout reached, redirecting to access denied.');
            window.location.href = window.location.origin + '/login?error=access_denied';
          }
        }, 6000);
      }
    } catch (err) {
      console.error('[Pre-Mount Upgrade] Fatal error:', err);
      localStorage.removeItem('upgrade_in_progress');
      window.location.href = window.location.origin + '/login?error=access_denied';
    }
  };
  checkAndUpgrade();
}

// Improved Protected Route Wrapper for strict access control
const ProtectedRoute: React.FC<{ 
  user: any, 
  loadingAuth: boolean, 
  requiredRole?: string | string[], 
  children: React.ReactElement 
}> = ({ user, loadingAuth, requiredRole, children }) => {
  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to={Page.LOGIN} replace />;
  }
  
  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!roles.includes(user.role)) {
      console.warn(`Access denied for role: ${user.role}. Required: ${roles.join(', ')}`);
      return <Navigate to={Page.HOME} replace />;
    }
  }
  
  return children;
};

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [listings, setListings] = useState<Kost[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [pendingTransaction, setPendingTransaction] = useState<{
    type: 'kost' | 'product';
    id: string;
  } | null>(null);
  const [hideNavbar, setHideNavbar] = useState(false);

  const handleBackNavigation = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate(
        user?.role === 'admin' ? Page.DASHBOARD_ADMIN : 
        user?.role === 'survey_agent' ? Page.DASHBOARD_AGENT : 
        user?.role === 'owner' ? Page.DASHBOARD_MITRA : 
        Page.HOME
      );
    }
  };

  // Fetch Public Listings on Mount or after Auth resolves
  const fetchListings = async () => {
    setLoadingListings(true);
    try {
      const data = await getPublishedProperties();
      setListings(data);
    } catch (error) {
      console.error('Failed to load listings', error);
    } finally {
      setLoadingListings(false);
    }
  };

  useEffect(() => {
    if (!loadingAuth) {
      fetchListings();
    }
  }, [loadingAuth]);

  // Build user object from Supabase session + users table
  const fetchUserData = async (supabaseUser: any) => {
    if (localStorage.getItem('upgrade_in_progress') === 'true') {
      console.log('[Upgrade] Blocking fetchUserData call during upgrade transaction.');
      setLoadingAuth(false);
      return;
    }

    if (!supabaseUser) {
      console.log("No supabaseUser, setting user to null.");
      setUser(null);
      setLoadingAuth(false);
      return;
    }

    try {
      console.log("Fetching profile for UID:", supabaseUser.id);
      // Fetch profile and private sensitive tables in parallel
      const [userRes, verificationRes, bankRes, mitraRes] = await Promise.all([
          supabase.from('users').select('*').eq('id', supabaseUser.id).maybeSingle(),
          supabase.from('user_verifications').select('*').eq('user_id', supabaseUser.id).maybeSingle(),
          supabase.from('user_bank_accounts').select('*').eq('user_id', supabaseUser.id).maybeSingle(),
          supabase.from('mitra').select('referred_by').eq('user_id', supabaseUser.id).maybeSingle()
        ]);
          
        if (userRes.error && userRes.error.code !== 'PGRST116') {
          console.warn("Could not fetch user profile from public table:", userRes.error.message);
        }
        
        console.log("Profile data received:", userRes.data);

        const profile = userRes.data || {};
        const verification = verificationRes.data || {};
        const bank = bankRes.data || {};
        const mitraVal = mitraRes?.data?.referred_by || '';
        
        // --- PENANGANAN AKUN DIBLOKIR ---
        if (profile.status === 'blocked') {
          console.warn("User is blocked. Signing out...");
          await supabase.auth.signOut();
          setUser(null);
          setLoadingAuth(false);
          navigate(`${Page.LOGIN}?error=blocked`, { replace: true });
          return;
        }

        let role = profile.role || 'user';
        if (profile.is_admin === true && (role === 'user' || role === 'mitra' || role === 'owner')) role = 'admin'; // Admin override
        
        // Normalize 'mitra' or 'owner' to 'owner' for internal logic consistency
        const normalizedRole = role.toLowerCase();
        if (normalizedRole === 'mitra' || normalizedRole === 'owner') role = 'owner';
        else if (normalizedRole === 'admin') role = 'admin';
        else if (normalizedRole === 'survey_agent') role = 'survey_agent';
        else role = 'user';

        // --- AKURASI PORTAL LOGIN PER ROLE ---
        const portalView = localStorage.getItem('portal_view') || 'user';
        if (portalView === 'owner' && role !== 'owner' && role !== 'admin') {
          console.warn("Regular user attempted to log in to owner portal.");
          await supabase.auth.signOut();
          setUser(null);
          setLoadingAuth(false);
          navigate(`${Page.LOGIN}?error=role_mismatch`, { replace: true });
          return;
        }

        if (portalView === 'user' && role === 'owner') {
          console.log("Partner logged in to user portal. Forcing user view.");
          role = 'user';
        }

        console.log("Determined role:", role);


        const safeUser = {
          uid: supabaseUser.id,
          id: supabaseUser.id,
          email: supabaseUser.email,
          emailVerified: supabaseUser.email_confirmed_at != null,
          photoURL: ensureAbsoluteUrl(profile.photo_url || supabaseUser.user_metadata?.avatar_url || '', 'profile-photos'),
          displayName: profile.name || supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || '',
          phoneNumber: profile.phone || '',
          photo_url: ensureAbsoluteUrl(profile.photo_url || '', 'profile-photos'), // Keep original but resolved for reference
          relationshipStatus: profile.relationship_status || '',
          occupation: profile.occupation || '',
          institution: profile.institution || '',
          gender: profile.gender || '',
          religion: profile.religion || '',
          address: profile.address || '',
          ...profile,
          ...verification,
          ...bank,
          referred_by: mitraVal,
          role,
        };

        setUser(safeUser);

        if (location.pathname === Page.LOGIN) {
          const isRecovery = new URLSearchParams(window.location.search).get('mode') === 'recovery';
          if (!isRecovery) {
            if (role === 'admin') navigate(Page.DASHBOARD_ADMIN, { replace: true });
            else if (role === 'survey_agent') navigate(Page.DASHBOARD_AGENT, { replace: true });
            else if (role === 'owner') navigate(Page.DASHBOARD_MITRA, { replace: true });
            else navigate(Page.HOME, { replace: true });
          }
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        setUser(null);
      }
      setLoadingAuth(false);
  };

  useEffect(() => {
    let mounted = true;

    // Listen to auth changes (login/logout/token refresh and initial mount)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth event triggered:", event, session);



      // Skip semua pemrosesan saat upgrade role sedang berlangsung di Login.tsx
      // (mencegah race condition: role belum diupdate di DB tapi user sudah di-redirect)
      if (localStorage.getItem('upgrade_in_progress') === 'true') {
        console.log('[Upgrade] Skipping auth state processing during upgrade flow.');
        setLoadingAuth(false);
        return;
      }

      // Intercept verification redirect (signup)
      if (event === 'SIGNED_IN' && getIsSignupConfirmation()) {
        await supabase.auth.signOut();
        navigate('/login?verified=true', { replace: true });
        return;
      }

      // Intercept password recovery redirect
      if (event === 'PASSWORD_RECOVERY') {
        navigate('/login?mode=recovery', { replace: true });
        if (mounted) {
          setTimeout(() => {
            if (mounted) fetchUserData(session?.user ?? null);
          }, 100);
        }
        return;
      }

      // INITIAL_SESSION occurs on first page load
      if (
        event === 'INITIAL_SESSION' ||
        event === 'SIGNED_IN' || 
        event === 'SIGNED_OUT' || 
        event === 'USER_UPDATED' ||
        event === 'TOKEN_REFRESHED'
      ) {
         if (mounted) {
           // Gunakan setTimeout agar kita melepaskan Auth Lock yang sedang ditahan
           // oleh event emitter Supabase, mencegah Deadlock `AbortError`.
           setTimeout(() => {
             if (mounted) fetchUserData(session?.user ?? null);
           }, 100);
         }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // --- SYNC (CROSS-TAB) ---
  useEffect(() => {
    // 1. Storage Event Listener (Cross-tab fallback)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'RS_MOCK_TIME' || e.key === 'RS_DATA_REFRESH') {
        console.log(`Sync event detected via storage (${e.key}). Reloading...`);
        window.location.reload();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // 2. BroadcastChannel Listener (Instant sync for active tabs)
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('RS_TIME_SYNC');
      channel.onmessage = (event) => {
        if (event.data.type === 'TIME_CHANGED') {
          console.log('Time sync received via BroadcastChannel. Reloading...');
          window.location.reload();
        }
      };
    } catch (e) {
      console.warn('BroadcastChannel not supported in this browser.');
    }

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      if (channel) channel.close();
    };
  }, []);

  // Listen to profile updates from sub-screens (e.g. MitraProfile draft/save)
  useEffect(() => {
    const handleProfileUpdateEvent = async () => {
      console.log("Profile update event detected. Reloading user data...");
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await fetchUserData(session.user);
      }
    };
    window.addEventListener('RS_USER_UPDATED', handleProfileUpdateEvent);
    return () => {
      window.removeEventListener('RS_USER_UPDATED', handleProfileUpdateEvent);
    };
  }, []);

  // Handle kostId deep link authentication check
  useEffect(() => {
    if (!loadingAuth) {
      if (location.pathname === Page.DETAIL && !user) {
        const params = new URLSearchParams(location.search);
        const kostId = params.get('kostId');
        if (kostId) {
          setPendingTransaction({ type: 'kost', id: kostId });
          alert('Login terlebih dahulu untuk melihat detail kost.');
          navigate(Page.LOGIN, { replace: true });
        }
      }
    }
  }, [loadingAuth, user, location.pathname, location.search, navigate]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname, location.search]);

  const handleAddKost = (newKost: Kost) => {
    setListings(prev => [newKost, ...prev]);
  };
  const handleEditKost = (updatedKost: Kost) => {
    setListings(prev => prev.map(item => item.id === updatedKost.id ? updatedKost : item));
  };
  const handleDeleteKost = (id: string) => {
    setListings(prev => prev.filter(item => item.id !== id));
  };

  const handleKostSelect = (id: string) => {
    // We removed the strict login block to allow unauthenticated users to view details (professional public SEO)
    navigate(`/kost/${id}`);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout Error', error);
    } finally {
      // Force clear local state no matter what happens with Supabase backend
      setUser(null);
      localStorage.removeItem('portal_view');
      navigate(Page.HOME);
      setPendingTransaction(null);
    }
  };

  const calculateAge = (birthDate: string): number => {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const isProfileComplete = (userData: any): boolean => {
    if (!userData) return false;
    return (
      !!userData.displayName &&
      !!userData.phone &&
      !!userData.occupation &&
      !!userData.institution &&
      !!userData.address &&
      !!userData.gender &&
      !!userData.religion &&
      !!userData.birth_date && // Added birth_date check
      (!!userData.relationshipStatus || !!userData.maritalStatus)
    );
  };

  const handleProfileSaveSuccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await fetchUserData(session.user);
    }
    alert('Data Tersimpan');
    if (pendingTransaction) {
      if (pendingTransaction.type === 'kost') {
        navigate(`/kost/${pendingTransaction.id}`);
      } else if (pendingTransaction.type === 'product') {
        navigate(Page.PRODUCTS);
      }
      setPendingTransaction(null);
    } else {
      if (user?.role === 'admin') {
        navigate(Page.DASHBOARD_ADMIN);
      } else if (user?.role === 'survey_agent') {
        navigate(Page.DASHBOARD_AGENT);
      } else if (user?.role === 'owner') {
        navigate(Page.DASHBOARD_MITRA);
      } else {
        navigate(Page.HOME);
      }
    }
  };

  const query = new URLSearchParams(location.search);
  const selectedKostId = query.get('kostId');
  const selectedKost = selectedKostId ? listings.find(k => k.id === selectedKostId) : null;

  const isDashboardPage = [
    Page.DASHBOARD_ADMIN,
    Page.DASHBOARD_AGENT,
    Page.DASHBOARD_MITRA,
    Page.DASHBOARD_OWNER,
  ].some(p => location.pathname.startsWith(p));

  // --- WRAPPER FOR DEEP LINK DETAIL ---
  const KostDetailWrapper = ({ listings, user, isProfileComplete, setPendingTransaction }: any) => {
    const { id } = useParams();
    const [kost, setKost] = useState<Kost | null>(listings.find((k: any) => k.id === id) || null);
    const [loading, setLoading] = useState(!kost);

    useEffect(() => {
      async function loadKost() {
        if (!id) return;
        if (!kost) {
          setLoading(true);
          try {
            const data = await getPublishedPropertyDetails(id);
            setKost(data);
          } catch (e) {
            console.error(e);
          } finally {
            setLoading(false);
          }
        }
      }
      loadKost();
    }, [id]);

    if (loading) return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );

    if (!kost) return <Navigate to={Page.LISTINGS} replace />;

    return (
      <KostDetail
        kost={kost}
        onBack={() => navigate(Page.LISTINGS)}
        user={user}
        onLoginRedirect={() => navigate(Page.LOGIN)}
        validateProfile={() => {
          if (!isProfileComplete(user)) {
            setPendingTransaction({ type: 'kost', id: kost.id });
            alert('Silahkan lengkapi profile sebelum transaksi.');
            navigate(Page.PROFILE);
            return false;
          }
          
          if (calculateAge(user.birth_date) < 17) {
            alert('Mohon maaf, usia minimal untuk melakukan transaksi adalah 17 tahun.');
            return false;
          }
          
          return true;
        }}
      />
    );
  };

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-orange-100 selection:text-orange-900">
      {!isDashboardPage && (
        <Navbar
          activePage={location.pathname as Page}
          onPageChange={(page) => {
            navigate(page);
            setPendingTransaction(null);
          }}
          user={user}
          onLogout={handleLogout}
          hideBottomNav={hideNavbar}
          hideNavLinks={location.pathname.startsWith(Page.DASHBOARD_MITRA)}
        />
      )}

      <main className="flex-grow">
        {loadingAuth ? (
          <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          </div>
        ) : (
           <Suspense fallback={<PageLoader />}>
           <Routes>
             <Route path="/payment-status/:orderId" element={<OrderPaymentStatus user={user} />} />
              <Route path={Page.HOME} element={<Home onPageChange={(p: Page | string) => navigate(p)} onKostSelect={handleKostSelect} user={user} listings={listings} loading={loadingListings} />} />
              <Route path={Page.LISTINGS} element={<Listings onKostClick={handleKostSelect} listings={listings} loading={loadingListings} user={user} onFilterToggle={setHideNavbar} />} />
              <Route path="/kost-dekat/:campusSlug" element={<Listings onKostClick={handleKostSelect} listings={listings} loading={loadingListings} user={user} onFilterToggle={setHideNavbar} />} />
              <Route path="/kost-area/:areaSlug" element={<Listings onKostClick={handleKostSelect} listings={listings} loading={loadingListings} user={user} onFilterToggle={setHideNavbar} />} />
            <Route path="/products/*" element={
              <Products
                user={user}
                onLoginRedirect={() => navigate(Page.LOGIN)}
                initialSelectedProductId={pendingTransaction?.type === 'product' ? pendingTransaction.id : undefined}
                validateProfile={(productId: string) => {
                  if (!isProfileComplete(user)) {
                    setPendingTransaction({ type: 'product', id: productId });
                    alert('Silahkan lengkapi profile sebelum transaksi.');
                    navigate(Page.PROFILE);
                    return false;
                  }
                  
                  if (calculateAge(user.birth_date) < 17) {
                    alert('Mohon maaf, usia minimal untuk melakukan transaksi adalah 17 tahun.');
                    return false;
                  }
                  
                  return true;
                }}
              />
            } />
            <Route path={Page.OWNER} element={<Owner />} />
            <Route path={Page.ABOUT} element={<About />} />
            <Route path={Page.CONTACT} element={<Contact />} />
            <Route path={Page.SURVEY_SERVICE} element={
              <SurveyService 
                user={user} 
                onPageChange={(p: Page) => navigate(p)} 
                validateProfile={() => {
                  if (!isProfileComplete(user)) {
                    alert('Silahkan lengkapi profile sebelum menggunakan layanan survey.');
                    navigate(Page.PROFILE);
                    return false;
                  }
                  
                  if (calculateAge(user.birth_date) < 17) {
                    alert('Mohon maaf, usia minimal untuk menggunakan layanan survey adalah 17 tahun.');
                    return false;
                  }
                  
                  return true;
                }}
              />
            } />
            <Route path={Page.TERMS} element={<Terms />} />
            <Route path={Page.KOSTMANAGER} element={<KostManagerLanding user={user} />} />
            <Route path={Page.ARTICLES} element={<Articles />} />
            <Route path={Page.ARTICLE_DETAIL} element={<Articles />} />
            <Route path={Page.SURVEY_CHECKOUT} element={
              <ProtectedRoute user={user} loadingAuth={loadingAuth}>
                <SurveyCheckout
                  user={user}
                  onPageChange={(p: Page) => navigate(p)}
                  validateProfile={() => {
                    if (!isProfileComplete(user)) {
                      alert('Silahkan lengkapi profile sebelum menggunakan layanan survey.');
                      navigate(Page.PROFILE);
                      return false;
                    }
                    if (calculateAge(user.birth_date) < 17) {
                      alert('Mohon maaf, usia minimal untuk menggunakan layanan survey adalah 17 tahun.');
                      return false;
                    }
                    return true;
                  }}
                />
              </ProtectedRoute>
            } />
            <Route path={`${Page.MY_BOOKINGS}/*`} element={
              <ProtectedRoute user={user} loadingAuth={loadingAuth}>
                <MyKost user={user} />
              </ProtectedRoute>
            } />
            <Route path={Page.CHAT} element={
              <ProtectedRoute user={user} loadingAuth={loadingAuth}>
                <Chat user={user} onPageChange={(p: Page) => navigate(p)} />
              </ProtectedRoute>
            } />
            
            <Route path={Page.LOGIN} element={
              (user && !location.search.includes('mode=recovery')) ? (
                <Navigate to={
                  user.role === 'admin' ? Page.DASHBOARD_ADMIN : 
                  user.role === 'survey_agent' ? Page.DASHBOARD_AGENT : 
                  user.role === 'owner' ? Page.DASHBOARD_MITRA : 
                  Page.HOME
                } replace />
              ) : (
                <Login onLoginSuccess={() => {
                  // Clear recovery URL params to allow App.tsx to redirect (notifying React Router)
                  if (location.search.includes('mode=recovery')) {
                    navigate(Page.LOGIN, { replace: true });
                  }
                  supabase.auth.getSession().then(({ data: { session } }) => fetchUserData(session?.user ?? null));
                }} />
              )
            } />
            
            <Route path={Page.PROFILE} element={
              <ProtectedRoute user={user} loadingAuth={loadingAuth}>
                <Profile
                  user={user}
                  onLogout={handleLogout}
                  onSaveSuccess={handleProfileSaveSuccess}
                  forceEdit={!!pendingTransaction}
                  onBack={handleBackNavigation}
                />
              </ProtectedRoute>
            } />
            
            <Route path={`${Page.DASHBOARD_ADMIN}/*`} element={
              <ProtectedRoute user={user} loadingAuth={loadingAuth} requiredRole="admin">
                <Dashboard 
                  role={user?.role || ''} 
                  user={user}
                  uid={user?.id} 
                  verificationStatus={user?.verification_status}
                  onPageChange={(p: Page) => navigate(p)} 
                  onLogout={handleLogout}
                  listings={listings} 
                  onAdd={handleAddKost} 
                  onEdit={handleEditKost} 
                  onDelete={handleDeleteKost} 
                  onRefreshListings={fetchListings} 
                />
              </ProtectedRoute>
            } />
            
            <Route path={`${Page.DASHBOARD_MITRA}/*`} element={
              <ProtectedRoute user={user} loadingAuth={loadingAuth} requiredRole="owner">
                <MitraDashboard 
                  user={user}
                  uid={user?.id}
                  onPageChange={(p: Page) => navigate(p)}
                  onAddKost={handleAddKost}
                  onEditKost={handleEditKost}
                  onDeleteKost={handleDeleteKost}
                  onLogout={handleLogout}
                />
              </ProtectedRoute>
            } />
            
            <Route path={Page.DASHBOARD_OWNER} element={
              <Navigate to={Page.DASHBOARD_MITRA} replace />
            } />
            
            <Route path={`${Page.DASHBOARD_AGENT}/*`} element={
              <ProtectedRoute user={user} loadingAuth={loadingAuth} requiredRole="survey_agent">
                <Dashboard 
                  role={user?.role || 'survey_agent'} 
                  user={user}
                  uid={user?.id} 
                  verificationStatus={user?.verification_status}
                  onPageChange={(p: Page) => navigate(p)} 
                  onLogout={handleLogout}
                  listings={listings} 
                  onAdd={handleAddKost} 
                  onEdit={handleEditKost} 
                  onDelete={handleDeleteKost} 
                  onRefreshListings={fetchListings} 
                />
              </ProtectedRoute>
            } />
            
            <Route path={Page.DETAIL_PATH} element={
              <KostDetailWrapper 
                listings={listings} 
                user={user} 
                isProfileComplete={isProfileComplete} 
                setPendingTransaction={setPendingTransaction} 
              />
            } />

            {/* Legacy redirect */}
            <Route path={Page.DETAIL} element={<Navigate to={selectedKostId ? `/kost/${selectedKostId}` : Page.LISTINGS} replace />} />

            <Route path="*" element={<Navigate to={Page.HOME} replace />} />
          </Routes>
          </Suspense>
        )}
      </main>

      {!isDashboardPage && location.pathname !== Page.KOSTMANAGER && <Footer onPageChange={(p: Page) => navigate(p)} />}
    </div>
  );
};

export default App;
