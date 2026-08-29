import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import Sidebar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Customers from './pages/Customers';
import CustomerDetails from './pages/CustomerDetails';
import AddCustomer from './pages/AddCustomer';
import { motion, AnimatePresence } from 'motion/react';
import { Input } from './components/ui/input';
import { Button } from './components/ui/button';
import { PlusCircle, Search } from 'lucide-react';
import { useDebounce } from './hooks/use-debounce';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [currentCustomerId, setCurrentCustomerId] = useState<string | null>(null);
  const [globalSearch, setGlobalSearch] = useState('');
  const debouncedSearch = useDebounce(globalSearch, 400);

  const handleViewCustomer = (id: string) => {
    setCurrentCustomerId(id);
    setCurrentPage('customer-details');
  };

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
        <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
        
        <main className="flex-1 flex flex-col min-w-0">
          {/* Theme Header */}
          <header className="p-8 pb-4 flex justify-between items-center gap-4">
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
                className="bg-white text-black border-[#F2F2F2] rounded-full py-6 pl-12 shadow-sm focus:border-[#B08D57] focus:ring-0 placeholder:text-black"
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
                className="bg-[#B08D57] hover:bg-[#967648] text-white px-8 py-6 rounded-full font-semibold shadow-md border-none cursor-pointer"
              >
                <PlusCircle className="mr-2 h-4 w-4" /> New Customer
              </Button>
              <div className="w-10 h-10 rounded-full bg-[#E5E5E5] border border-[#D1D1D1] flex items-center justify-center">
                <span className="text-xs font-bold text-black">JS</span>
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
