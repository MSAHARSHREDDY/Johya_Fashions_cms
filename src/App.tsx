import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fetchPointSettingsRemote } from './lib/settings';
import { Toaster, toast } from 'sonner';
import Sidebar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Customers from './pages/Customers';
import CustomerDetails from './pages/CustomerDetails';
import AddCustomer from './pages/AddCustomer';
import LoginPage from './pages/Login';
import { motion, AnimatePresence } from 'motion/react';
import { Input } from './components/ui/input';
import { Button } from './components/ui/button';
import { PlusCircle, Search, LogOut, Crown, ShieldCheck, ChevronDown } from 'lucide-react';
import { useDebounce } from './hooks/use-debounce';
import { AuthUser } from './types/auth';
import { getStoredUser, clearStoredUser } from './lib/auth';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => getStoredUser());
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [currentCustomerId, setCurrentCustomerId] = useState<string | null>(null);
  const [globalSearch, setGlobalSearch] = useState('');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const debouncedSearch = useDebounce(globalSearch, 400);

  useEffect(() => {
    if (currentUser) {
      fetchPointSettingsRemote();
    }
  }, [currentUser]);

  const handleLoginSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    // Explicitly redirect to dashboard upon successful login
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    clearStoredUser();
    setCurrentUser(null);
    setUserDropdownOpen(false);
    toast.info('You have been logged out.');
  };

  const handleViewCustomer = (id: string) => {
    setCurrentCustomerId(id);
    setCurrentPage('customer-details');
  };

  // If user is NOT logged in, show ONLY the login page itself
  if (!currentUser) {
    return (
      <QueryClientProvider client={queryClient}>
        <LoginPage onLoginSuccess={handleLoginSuccess} />
        <Toaster position="top-right" closeButton richColors />
      </QueryClientProvider>
    );
  }

  const isSuperAdmin = currentUser.role === 'superadmin';
  const initials = currentUser.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'AD';

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'customers':
        return <Customers onView={handleViewCustomer} globalSearch={debouncedSearch} />;
      case 'settings':
        return <Settings />;
      case 'create':
        return <AddCustomer onBack={() => setCurrentPage('customers')} />;
      case 'customer-details':
        return currentCustomerId ? (
          <CustomerDetails 
            customerId={currentCustomerId} 
            onBack={() => setCurrentPage('customers')}
            onEdit={() => setCurrentPage('customers')}
          />
        ) : <Dashboard />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen bg-white text-black">
        <Sidebar 
          currentPage={currentPage} 
          onPageChange={setCurrentPage} 
          user={currentUser}
          onLogout={handleLogout}
        />
        
        <main className="flex-1 flex flex-col min-w-0">
          {/* Top Header */}
          <header className="p-8 pb-4 flex justify-between items-center gap-4 relative">
            <form 
              className="relative w-full max-w-md"
              onSubmit={(e) => {
                e.preventDefault();
                if (currentPage !== 'customers') setCurrentPage('customers');
              }}
            >
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-black" />
              <Input 
                placeholder="Search by name or phone..." 
                className="bg-white text-black border-[#F2F2F2] rounded-full py-6 pl-12 shadow-sm focus:border-[#B08D57] focus:ring-0 placeholder:text-neutral-400"
                value={globalSearch}
                onChange={(e) => {
                  setGlobalSearch(e.target.value);
                  if (currentPage !== 'customers' && e.target.value) {
                    setCurrentPage('customers');
                  }
                }}
              />
            </form>

            <div className="flex items-center gap-4">
              <Button 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentPage('create');
                }} 
                className="bg-[#B08D57] hover:bg-[#967648] text-white px-6 sm:px-8 py-6 rounded-full font-semibold shadow-md border-none cursor-pointer text-sm"
              >
                <PlusCircle className="mr-2 h-4 w-4" /> New Customer
              </Button>

              {/* User Profile Pill & Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2.5 p-1.5 pr-3 rounded-full hover:bg-neutral-100 border border-neutral-200/80 transition-colors cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#B08D57] to-[#8C6D39] text-white flex items-center justify-center font-bold text-xs shadow-sm">
                    {initials}
                  </div>
                  <div className="hidden md:flex flex-col text-left">
                    <span className="text-xs font-semibold text-neutral-900 leading-tight">
                      {currentUser.name}
                    </span>
                    <span className="text-[10px] text-neutral-500 flex items-center gap-1 font-medium capitalize">
                      {isSuperAdmin ? (
                        <>
                          <Crown className="w-2.5 h-2.5 text-[#B08D57]" /> Super Admin
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-2.5 h-2.5 text-neutral-600" /> Admin
                        </>
                      )}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-neutral-400 hidden sm:block" />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setUserDropdownOpen(false)} 
                    />
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-neutral-200 z-50 py-2 divide-y divide-neutral-100 animate-in fade-in-0 zoom-in-95">
                      <div className="px-4 py-3">
                        <p className="text-xs text-neutral-400 font-medium">Signed in as</p>
                        <p className="text-sm font-semibold text-neutral-900 truncate">{currentUser.name}</p>
                        <div className="mt-1 flex items-center gap-1.5">
                          {isSuperAdmin ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#B08D57]/15 text-[#8C6D39] border border-[#B08D57]/30">
                              <Crown className="w-2.5 h-2.5" /> SUPER ADMIN
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 text-neutral-800 border border-neutral-200">
                              <ShieldCheck className="w-2.5 h-2.5" /> STORE ADMIN
                            </span>
                          )}
                          <span className="text-[11px] text-neutral-400 truncate">
                            {currentUser.email}
                          </span>
                        </div>
                      </div>

                      <div className="py-1">
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentPage('dashboard');
                            setUserDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-xs text-neutral-700 hover:bg-neutral-50 flex items-center gap-2 cursor-pointer"
                        >
                          Dashboard
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentPage('customers');
                            setUserDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-xs text-neutral-700 hover:bg-neutral-50 flex items-center gap-2 cursor-pointer"
                        >
                          Customer Directory
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentPage('settings');
                            setUserDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-xs text-neutral-700 hover:bg-neutral-50 flex items-center gap-2 cursor-pointer"
                        >
                          Point Settings
                        </button>
                      </div>

                      <div className="py-1">
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </header>

          <div className="p-8 pt-4 flex-grow overflow-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPage}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="h-full"
              >
                {renderPage()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        <Toaster position="top-right" closeButton richColors />
      </div>
    </QueryClientProvider>
  );
}
