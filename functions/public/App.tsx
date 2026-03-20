import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { supabase } from './supabase';
import { Page, Kost } from './types';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Listings from './pages/Listings';
import Products from './pages/Products';
import About from './pages/About';
import Contact from './pages/Contact';
import Owner from './pages/Owner';
import Login from './pages/Login';
import Profile from './pages/Profile';
import KostDetail from './pages/KostDetail';
import Dashboard from './pages/Dashboard';
import SurveyService from './pages/SurveyService';
import MyKost from './pages/MyKost';
import OrderPaymentStatus from './pages/OrderPaymentStatus';
import { getPublishedProperties } from './userService';

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

  const handleBackNavigation = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate(user?.role === 'admin' ? Page.DASHBOARD_ADMIN : Page.HOME);
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
    console.log("fetchUserData called with:", supabaseUser);
    if (!supabaseUser) {
      console.log("No supabaseUser, setting user to null.");
      setUser(null);
      setLoadingAuth(false);
      return;
    }

    try {
      console.log("Fetching profile for UID:", supabaseUser.id);
      // Fetch profile from 'users' table
      const { data: dbData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();
        
      if (error && error.code !== 'PGRST116') {
        console.warn("Could not fetch user profile from public table:", error.message);
      }
      
      console.log("dbData received:", dbData);

      const profile = dbData || {};
      let role = profile.role || 'user';
      if (profile.is_admin === true) role = 'admin';
      
      console.log("Determined role:", role);

      const safeUser = {
        uid: supabaseUser.id,
        id: supabaseUser.id,
        email: supabaseUser.email,
        emailVerified: supabaseUser.email_confirmed_at != null,
        photoURL: profile.photo_url || supabaseUser.user_metadata?.avatar_url || '',
        displayName: profile.name || supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || '',
        phoneNumber: profile.phone || '',
        photo_url: profile.photo_url || '', // Keep original for reference
        relationshipStatus: profile.relationship_status || '',
        occupation: profile.occupation || '',
        institution: profile.institution || '',
        gender: profile.gender || '',
        religion: profile.religion || '',
        address: profile.address || '',
        ...profile,
        role,
      };

      setUser(safeUser);

      if (role === 'admin' && location.pathname === Page.LOGIN) {
        navigate(Page.DASHBOARD_ADMIN, { replace: true });
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth event triggered:", event, session);
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
           }, 0);
         }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
    if (!user) {
      alert('Login terlebih dahulu untuk akses selengkapnya.');
      navigate(Page.LOGIN);
      return;
    }
    navigate(`${Page.DETAIL}?kostId=${id}`);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout Error', error);
    } finally {
      // Force clear local state no matter what happens with Supabase backend
      setUser(null);
      navigate(Page.HOME);
      setPendingTransaction(null);
    }
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
        navigate(`${Page.DETAIL}?kostId=${pendingTransaction.id}`);
      } else if (pendingTransaction.type === 'product') {
        navigate(Page.PRODUCTS);
      }
      setPendingTransaction(null);
    } else {
      if (user?.role === 'admin') {
        navigate(Page.DASHBOARD_ADMIN);
      } else {
        navigate(Page.HOME);
      }
    }
  };

  const query = new URLSearchParams(location.search);
  const selectedKostId = query.get('kostId');
  const selectedKost = selectedKostId ? listings.find(k => k.id === selectedKostId) : null;

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-orange-100 selection:text-orange-900">
      <Navbar
        activePage={location.pathname as Page}
        onPageChange={(page) => {
          navigate(page);
          setPendingTransaction(null);
        }}
        user={user}
        onLogout={handleLogout}
      />

      <main className="flex-grow">
        {loadingAuth ? (
          <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          </div>
        ) : (
           <Routes>
             <Route path="/payment-status/:orderId" element={<OrderPaymentStatus user={user} />} />
             <Route path={Page.HOME} element={<Home onPageChange={(p: Page) => navigate(p)} onKostSelect={handleKostSelect} user={user} listings={listings} loading={loadingListings} />} />
            <Route path={Page.LISTINGS} element={<Listings onKostClick={handleKostSelect} listings={listings} loading={loadingListings} user={user} />} />
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
                  return true;
                }}
              />
            } />
            <Route path={Page.OWNER} element={<Owner />} />
            <Route path={Page.ABOUT} element={<About />} />
            <Route path={Page.CONTACT} element={<Contact />} />
            <Route path={Page.SURVEY_SERVICE} element={<SurveyService user={user} />} />
            <Route path={Page.MY_BOOKINGS} element={<MyKost user={user} onPageChange={(p: Page) => navigate(p)} />} />
            
            <Route path={Page.LOGIN} element={
              (user && !location.search.includes('mode=recovery')) ? (
                <Navigate to={user.role === 'admin' ? Page.DASHBOARD_ADMIN : Page.HOME} replace />
              ) : (
                <Login onLoginSuccess={() => {
                  // Clear recovery URL params to allow App.tsx to redirect
                  if (window.location.search.includes('mode=recovery')) {
                    window.history.replaceState({}, document.title, window.location.origin + window.location.pathname);
                  }
                  supabase.auth.getSession().then(({ data: { session } }) => fetchUserData(session?.user ?? null));
                }} />
              )
            } />
            
            <Route path={Page.PROFILE} element={
              <Profile
                user={user}
                onLogout={handleLogout}
                onSaveSuccess={handleProfileSaveSuccess}
                forceEdit={!!pendingTransaction}
                onBack={handleBackNavigation}
              />
            } />
            
            <Route path={Page.DASHBOARD_ADMIN} element={
              <Dashboard role={user?.role || 'admin'} uid={user?.id} onPageChange={(p: Page) => navigate(p)} listings={listings} onAdd={handleAddKost} onEdit={handleEditKost} onDelete={handleDeleteKost} onRefreshListings={fetchListings} />
            } />
            
            <Route path={Page.DASHBOARD_OWNER} element={
              <Dashboard role={user?.role || 'owner'} uid={user?.id} onPageChange={(p: Page) => navigate(p)} listings={listings} onAdd={handleAddKost} onEdit={handleEditKost} onDelete={handleDeleteKost} onRefreshListings={fetchListings} />
            } />
            
            <Route path={Page.DETAIL} element={
              selectedKost ? (
                <KostDetail
                  kost={selectedKost}
                  onBack={() => navigate(Page.LISTINGS)}
                  user={user}
                  onLoginRedirect={() => navigate(Page.LOGIN)}
                  validateProfile={() => {
                    if (!isProfileComplete(user)) {
                      setPendingTransaction({ type: 'kost', id: selectedKost.id });
                      alert('Silahkan lengkapi profile sebelum transaksi.');
                      navigate(Page.PROFILE);
                      return false;
                    }
                    return true;
                  }}
                />
              ) : (
                <Navigate to={Page.LISTINGS} replace />
              )
            } />

            <Route path="*" element={<Navigate to={Page.HOME} replace />} />
          </Routes>
        )}
      </main>

      <Footer onPageChange={(p: Page) => navigate(p)} />
    </div>
  );
};

export default App;
